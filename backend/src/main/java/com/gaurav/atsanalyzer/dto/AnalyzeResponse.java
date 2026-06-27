package com.gaurav.atsanalyzer.dto;

import lombok.Data;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
public class AnalyzeResponse {
    private UUID historyId;
    private double overallScore;
    private int atsPassProbability;
    private String verdict;
    private String verdictTitle;
    private String verdictSub;
    private String atsNote;
    private List<Dimension> dimensions;
    private Keywords keywords;
    private List<String> rejectionFlags;
    private Actions actions;
    private List<LatexEdit> latexEdits;

    @Data
    public static class Dimension {
        private String label;
        private double score;
        private int weight;
    }

    @Data
    public static class Keywords {
        private List<String> matched;
        private List<String> missing;
        private List<String> weak;
    }

    @Data
    public static class Actions {
        private List<String> high;
        private List<String> medium;
        private List<String> low;
    }

    @Data
    public static class LatexEdit {
        private String where;
        private String change;
        private String snippet;
    }
}
