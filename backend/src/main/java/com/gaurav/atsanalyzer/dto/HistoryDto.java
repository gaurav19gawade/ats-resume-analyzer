package com.gaurav.atsanalyzer.dto;

import lombok.Data;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

public class HistoryDto {

    @Data
    public static class Summary {
        private UUID id;
        private String jobTitle;
        private String company;
        private String atsPlatform;
        private Double overallScore;
        private String verdict;
        private OffsetDateTime createdAt;
    }

    @Data
    public static class Detail {
        private UUID id;
        private String jobTitle;
        private String company;
        private String atsPlatform;
        private Double overallScore;
        private String verdict;
        private Map<String, Object> resultJson;
        private OffsetDateTime createdAt;
    }
}
