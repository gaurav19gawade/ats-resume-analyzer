package com.gaurav.atsanalyzer.security;

import com.gaurav.atsanalyzer.config.AppProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import com.fasterxml.jackson.databind.ObjectMapper;

@Slf4j
@Component
public class SupabaseJwtFilter extends OncePerRequestFilter {

    private final AppProperties appProperties;
    private final ObjectMapper objectMapper;

    // Cache public keys — they rarely change
    private final Map<String, PublicKey> keyCache = new ConcurrentHashMap<>();
    private volatile boolean keysFetched = false;

    public SupabaseJwtFilter(AppProperties appProperties, ObjectMapper objectMapper) {
        this.appProperties = appProperties;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String token = extractToken(request);

        if (StringUtils.hasText(token)) {
            try {
                Claims claims = verifyToken(token);
                if (claims != null) {
                    String userId = claims.getSubject();
                    String email  = claims.get("email", String.class);

                    AuthenticatedUser principal = new AuthenticatedUser(
                            UUID.fromString(userId), email);

                    UsernamePasswordAuthenticationToken auth =
                            new UsernamePasswordAuthenticationToken(
                                    principal, null,
                                    List.of(new SimpleGrantedAuthority("ROLE_USER")));

                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            } catch (Exception e) {
                log.warn("Invalid JWT token: {}", e.getMessage());
            }
        }

        filterChain.doFilter(request, response);
    }

    private Claims verifyToken(String token) {
        // First try JWKS (ES256 — newer Supabase projects)
        try {
            loadJwksIfNeeded();
            for (PublicKey key : keyCache.values()) {
                try {
                    return Jwts.parser()
                            .verifyWith(key)
                            .build()
                            .parseSignedClaims(token)
                            .getPayload();
                } catch (JwtException ignored) {
                    // Try next key
                }
            }
        } catch (Exception e) {
            log.debug("JWKS verification failed, falling back to HMAC: {}", e.getMessage());
        }

        // Fallback: HMAC (HS256 — older Supabase projects)
        try {
            byte[] secret = appProperties.getSupabase().getJwtSecret()
                    .getBytes(java.nio.charset.StandardCharsets.UTF_8);
            return Jwts.parser()
                    .verifyWith(io.jsonwebtoken.security.Keys.hmacShaKeyFor(secret))
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (JwtException e) {
            log.warn("HMAC verification also failed: {}", e.getMessage());
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    private void loadJwksIfNeeded() throws Exception {
        if (keysFetched && !keyCache.isEmpty()) return;

        String supabaseUrl = appProperties.getSupabase().getProjectUrl();
        if (supabaseUrl == null || supabaseUrl.isBlank()) {
            log.debug("No Supabase project URL configured, skipping JWKS fetch");
            return;
        }

        String jwksUrl = supabaseUrl + "/auth/v1/.well-known/jwks.json";
        log.info("Fetching Supabase JWKS from: {}", jwksUrl);

        HttpClient client = HttpClient.newHttpClient();
        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(jwksUrl))
                .GET()
                .build();

        HttpResponse<String> resp = client.send(req, HttpResponse.BodyHandlers.ofString());

        if (resp.statusCode() != 200) {
            log.warn("JWKS fetch returned status {}", resp.statusCode());
            return;
        }

        Map<String, Object> jwks = objectMapper.readValue(resp.body(), Map.class);
        List<Map<String, Object>> keys = (List<Map<String, Object>>) jwks.get("keys");

        if (keys == null || keys.isEmpty()) {
            log.warn("No keys found in JWKS response");
            return;
        }

        for (Map<String, Object> jwk : keys) {
            try {
                String kty = (String) jwk.get("kty");
                String kid = (String) jwk.get("kid");

                if ("EC".equals(kty)) {
                    // ES256 — parse x/y coordinates
                    String x = (String) jwk.get("x");
                    String y = (String) jwk.get("y");
                    PublicKey publicKey = buildECPublicKey(x, y);
                    keyCache.put(kid != null ? kid : "ec-" + keyCache.size(), publicKey);
                    log.info("Loaded EC public key: {}", kid);
                } else if ("RSA".equals(kty)) {
                    // RS256 — parse n/e
                    String n = (String) jwk.get("n");
                    String e = (String) jwk.get("e");
                    PublicKey publicKey = buildRSAPublicKey(n, e);
                    keyCache.put(kid != null ? kid : "rsa-" + keyCache.size(), publicKey);
                    log.info("Loaded RSA public key: {}", kid);
                }
            } catch (Exception e) {
                log.warn("Failed to parse JWK entry: {}", e.getMessage());
            }
        }

        keysFetched = true;
    }

    private PublicKey buildECPublicKey(String x, String y) throws Exception {
        // Build uncompressed EC point: 0x04 + x-bytes + y-bytes
        byte[] xBytes = Base64.getUrlDecoder().decode(x);
        byte[] yBytes = Base64.getUrlDecoder().decode(y);

        // Build SubjectPublicKeyInfo for P-256
        // OID for EC: 1.2.840.10045.2.1, OID for P-256: 1.2.840.10045.3.1.7
        byte[] ecOid   = {0x06, 0x07, 0x2a, (byte)0x86, 0x48, (byte)0xce, 0x3d, 0x02, 0x01};
        byte[] p256Oid = {0x06, 0x08, 0x2a, (byte)0x86, 0x48, (byte)0xce, 0x3d, 0x03, 0x01, 0x07};

        // AlgorithmIdentifier
        byte[] algId = concat(new byte[]{0x30, (byte)(ecOid.length + p256Oid.length)}, ecOid, p256Oid);

        // Uncompressed point
        byte[] point = new byte[1 + xBytes.length + yBytes.length];
        point[0] = 0x04;
        System.arraycopy(xBytes, 0, point, 1, xBytes.length);
        System.arraycopy(yBytes, 0, point, 1 + xBytes.length, yBytes.length);

        // BitString wrapper
        byte[] bitString = concat(new byte[]{0x03, (byte)(point.length + 1), 0x00}, point);

        // Full SubjectPublicKeyInfo
        byte[] spki = concat(new byte[]{0x30, (byte)(algId.length + bitString.length)}, algId, bitString);

        KeyFactory kf = KeyFactory.getInstance("EC");
        return kf.generatePublic(new X509EncodedKeySpec(spki));
    }

    private PublicKey buildRSAPublicKey(String n, String e) throws Exception {
        java.math.BigInteger modulus  = new java.math.BigInteger(1, Base64.getUrlDecoder().decode(n));
        java.math.BigInteger exponent = new java.math.BigInteger(1, Base64.getUrlDecoder().decode(e));
        java.security.spec.RSAPublicKeySpec spec = new java.security.spec.RSAPublicKeySpec(modulus, exponent);
        return KeyFactory.getInstance("RSA").generatePublic(spec);
    }

    private byte[] concat(byte[]... arrays) {
        int total = 0;
        for (byte[] a : arrays) total += a.length;
        byte[] result = new byte[total];
        int pos = 0;
        for (byte[] a : arrays) {
            System.arraycopy(a, 0, result, pos, a.length);
            pos += a.length;
        }
        return result;
    }

    private String extractToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (StringUtils.hasText(header) && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        return null;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        return path.equals("/api/health");
    }
}