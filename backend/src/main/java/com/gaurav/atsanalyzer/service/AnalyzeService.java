package com.gaurav.atsanalyzer.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gaurav.atsanalyzer.client.AnthropicClient;
import com.gaurav.atsanalyzer.dto.AnalyzeRequest;
import com.gaurav.atsanalyzer.dto.AnalyzeResponse;
import com.gaurav.atsanalyzer.model.AnalysisHistory;
import com.gaurav.atsanalyzer.repository.AnalysisHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalyzeService {

    private final AnthropicClient anthropicClient;
    private final AnalysisHistoryRepository historyRepository;
    private final ObjectMapper objectMapper;

    private static final Map<String, String> ATS_LABELS = Map.ofEntries(
            Map.entry("workday", "Workday"),
            Map.entry("taleo", "Taleo (Oracle)"),
            Map.entry("icims", "iCIMS"),
            Map.entry("successfactors", "SAP SuccessFactors"),
            Map.entry("greenhouse", "Greenhouse"),
            Map.entry("lever", "Lever"),
            Map.entry("smartrecruiters", "SmartRecruiters"),
            Map.entry("jobvite", "Jobvite"),
            Map.entry("bamboohr", "BambooHR"),
            Map.entry("adp", "ADP Workforce Now"),
            Map.entry("bullhorn", "Bullhorn"),
            Map.entry("avature", "Avature"),
            Map.entry("jazzhr", "JazzHR"),
            Map.entry("rippling", "Rippling"),
            Map.entry("teamtailor", "Teamtailor"),
            Map.entry("unknown", "Unknown / Generic ATS")
    );

    public AnalyzeResponse analyze(AnalyzeRequest request, UUID userId) {
        String atsLabel = ATS_LABELS.getOrDefault(
                request.getAtsPlatform().toLowerCase(), request.getAtsPlatform());

        AnalyzeResponse response = anthropicClient.analyze(request, atsLabel);

        if (request.isSaveToHistory()) {
            saveHistory(request, response, userId);
        }

        return response;
    }

    @SuppressWarnings("unchecked")
    private void saveHistory(AnalyzeRequest request, AnalyzeResponse response, UUID userId) {
        try {
            Map<String, Object> resultMap = objectMapper.convertValue(response, Map.class);

            AnalysisHistory history = AnalysisHistory.builder()
                    .userId(userId)
                    .jobTitle(request.getJobTitle())
                    .company(request.getCompany())
                    .atsPlatform(request.getAtsPlatform())
                    .overallScore(response.getOverallScore())
                    .verdict(response.getVerdict())
                    .resultJson(resultMap)
                    .build();

            AnalysisHistory saved = historyRepository.save(history);
            response.setHistoryId(saved.getId());

        } catch (Exception e) {
            log.warn("Failed to save analysis history for user {}: {}", userId, e.getMessage());
            // Non-fatal — don't fail the response over a history save failure
        }
    }
}
