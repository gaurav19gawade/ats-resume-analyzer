package com.gaurav.atsanalyzer.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

public class TemplateDto {

    @Data
    public static class Request {
        @NotBlank(message = "Template name is required")
        @Size(max = 100, message = "Name must be under 100 characters")
        private String name;

        @NotBlank(message = "Content is required")
        @Size(min = 50, max = 8000, message = "Content must be between 50 and 8000 characters")
        private String content;

        @NotBlank(message = "ATS platform is required")
        private String atsPlatform;
    }

    @Data
    public static class Response {
        private UUID id;
        private String name;
        private String content;
        private String atsPlatform;
        private OffsetDateTime createdAt;
        private OffsetDateTime updatedAt;
    }
}
