package com.gaurav.atsanalyzer.client;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gaurav.atsanalyzer.config.AppProperties;
import com.gaurav.atsanalyzer.dto.AnalyzeRequest;
import com.gaurav.atsanalyzer.dto.AnalyzeResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class AnthropicClient {

    private final AppProperties appProperties;
    private final ObjectMapper objectMapper;

    private static final String SYSTEM_PROMPT = """
            You are a Senior Technical Recruiter with 20 years of experience specializing in software engineering roles across enterprise, consulting, financial services, and technology companies. You have deep expertise in how Applicant Tracking Systems parse, score, and filter resumes — including their specific quirks around keyword matching, formatting, and section recognition.
            
            Your task is to assess a resume against a job description for the specified ATS platform.
            Be brutally honest. A score that gets the candidate an interview is more valuable than one that makes them feel good.
            Prioritize ATS filter pass-through first, human reviewer impression second.
            
            Respond ONLY with a valid JSON object. No preamble, no markdown fences, no explanation outside the JSON.
            
            JSON schema (all fields required):
            {
              "overall_score": <number 0.0-10.0, one decimal>,
              "ats_pass_probability": <integer 0-100>,
              "verdict": <"STRONG MATCH" | "MODERATE MATCH" | "WEAK MATCH" | "DO NOT APPLY">,
              "verdict_title": <string, 10 words max>,
              "verdict_sub": <string, 25 words max>,
              "ats_note": <string, ATS-specific parsing risks or tips, 40 words max, empty string if platform is unknown>,
              "dimensions": [
                {"label": "Technical skills match", "score": <0-10>, "weight": 30},
                {"label": "Experience and seniority", "score": <0-10>, "weight": 20},
                {"label": "Domain relevance", "score": <0-10>, "weight": 15},
                {"label": "ATS keyword density", "score": <0-10>, "weight": 20},
                {"label": "Impact and metrics", "score": <0-10>, "weight": 15}
              ],
              "keywords": {
                "matched": [<up to 20 strings — JD keywords present in resume>],
                "missing": [<up to 15 strings — critical JD keywords absent from resume>],
                "weak": [<up to 10 strings — JD terms present but underused or buried>]
              },
              "rejection_flags": [<up to 8 strings — specific risks that could cause auto-rejection>],
              "actions": {
                "high": [<up to 5 strings — ATS-critical, do immediately>],
                "medium": [<up to 5 strings — do before applying>],
                "low": [<up to 4 strings — polish>]
              },
              "latex_edits": [
                {
                  "where": <string — section name, e.g. "Professional Summary", "Skills section">,
                  "change": <string — what to change and why, 30 words max>,
                  "snippet": <string — actual LaTeX to add or replace, use literal newlines>
                }
              ]
            }
            
            Rules for latex_edits:
            - Provide 4-7 specific, actionable edits
            - Each snippet must be real, copy-paste-ready LaTeX (not pseudocode)
            - Tailor snippets to standard LaTeX resume packages (moderncv, altacv, or generic \\section / \\item style)
            - Focus on adding missing keywords naturally, not keyword stuffing
            """;

    public AnalyzeResponse analyze(AnalyzeRequest request, String atsLabel) {
        AppProperties.Anthropic cfg = appProperties.getAnthropic();

        String jd = truncate(request.getJobDescription(), cfg.getJdMaxChars());
        String resume = truncate(request.getResumeContent(), cfg.getResumeMaxChars());

        String userMessage = """
                ATS PLATFORM: %s
                
                JOB DESCRIPTION:
                %s
                
                RESUME (LaTeX source):
                %s
                """.formatted(atsLabel, jd, resume);

        Map<String, Object> requestBody = Map.of(
                "model", cfg.getModel(),
                "max_tokens", cfg.getMaxTokens(),
                "system", SYSTEM_PROMPT,
                "messages", List.of(Map.of("role", "user", "content", userMessage))
        );

        RestClient restClient = RestClient.builder()
                .baseUrl(cfg.getBaseUrl())
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader("x-api-key", cfg.getApiKey())
                .defaultHeader("anthropic-version", "2023-06-01")
                .build();

        log.info("Calling Anthropic API for ATS platform: {}", atsLabel);

        Map<String, Object> rawResponse = restClient.post()
                .uri("/v1/messages")
                .body(requestBody)
                .retrieve()
                .body(Map.class);

        String jsonText = stripMarkdownFences(extractText(rawResponse));

        try {
            return objectMapper.readValue(jsonText, AnalyzeResponse.class);
        } catch (Exception e) {
            log.error("Failed to parse Anthropic response: {}", jsonText, e);
            throw new RuntimeException("Failed to parse AI response. Please try again.");
        }
    }

    @SuppressWarnings("unchecked")
    private String extractText(Map<String, Object> response) {
        List<Map<String, Object>> content = (List<Map<String, Object>>) response.get("content");
        if (content == null || content.isEmpty()) {
            throw new RuntimeException("Empty response from AI");
        }
        return content.stream()
                .filter(b -> "text".equals(b.get("type")))
                .map(b -> (String) b.get("text"))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("No text block in AI response"));
    }

    private String stripMarkdownFences(String text) {
        if (text == null) return "";
        String stripped = text.trim();
        // Remove ```json ... ``` or ``` ... ``` wrappers Claude sometimes adds
        if (stripped.startsWith("```")) {
            stripped = stripped.replaceFirst("^```(?:json)?\s*", "");
            stripped = stripped.replaceAll("```\s*$", "");
        }
        return stripped.trim();
    }

    private String truncate(String text, int maxChars) {
        if (text == null) return "";
        int docStart = text.indexOf("\\begin{document}");
        if (docStart > 0) {
            text = text.substring(docStart);
        }
        return text.length() > maxChars ? text.substring(0, maxChars) : text;
    }
}