package com.gaurav.atsanalyzer.service;

import com.gaurav.atsanalyzer.dto.HistoryDto;
import com.gaurav.atsanalyzer.model.AnalysisHistory;
import com.gaurav.atsanalyzer.repository.AnalysisHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class HistoryService {

    private final AnalysisHistoryRepository repository;

    public Page<HistoryDto.Summary> getHistory(UUID userId, int page, int size) {
        size = Math.min(size, 50);
        return repository.findByUserIdOrderByCreatedAtDesc(
                userId, PageRequest.of(page, size))
                .map(this::toSummary);
    }

    public HistoryDto.Detail getDetail(UUID id, UUID userId) {
        return repository.findByIdAndUserId(id, userId)
                .map(this::toDetail)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "History entry not found"));
    }

    @Transactional
    public void delete(UUID id, UUID userId) {
        AnalysisHistory h = repository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "History entry not found"));
        repository.delete(h);
    }

    private HistoryDto.Summary toSummary(AnalysisHistory h) {
        HistoryDto.Summary s = new HistoryDto.Summary();
        s.setId(h.getId());
        s.setJobTitle(h.getJobTitle());
        s.setCompany(h.getCompany());
        s.setAtsPlatform(h.getAtsPlatform());
        s.setOverallScore(h.getOverallScore());
        s.setVerdict(h.getVerdict());
        s.setCreatedAt(h.getCreatedAt());
        return s;
    }

    private HistoryDto.Detail toDetail(AnalysisHistory h) {
        HistoryDto.Detail d = new HistoryDto.Detail();
        d.setId(h.getId());
        d.setJobTitle(h.getJobTitle());
        d.setCompany(h.getCompany());
        d.setAtsPlatform(h.getAtsPlatform());
        d.setOverallScore(h.getOverallScore());
        d.setVerdict(h.getVerdict());
        d.setResultJson(h.getResultJson());
        d.setCreatedAt(h.getCreatedAt());
        return d;
    }
}
