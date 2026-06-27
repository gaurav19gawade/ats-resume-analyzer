package com.gaurav.atsanalyzer.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import lombok.Data;

@Data
@Configuration
@ConfigurationProperties(prefix = "app")
public class AppProperties {

    private Anthropic anthropic = new Anthropic();
    private Supabase supabase = new Supabase();
    private Cors cors = new Cors();

    @Data
    public static class Anthropic {
        private String apiKey;
        private String baseUrl;
        private String model;
        private int maxTokens;
        private int jdMaxChars;
        private int resumeMaxChars;
    }

    @Data
    public static class Supabase {
        private String jwtSecret;
        private String projectUrl;
    }

    @Data
    public static class Cors {
        private String allowedOrigins;
    }
}