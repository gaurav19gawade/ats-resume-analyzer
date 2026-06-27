package com.gaurav.atsanalyzer.controller;

import com.gaurav.atsanalyzer.dto.AnalyzeRequest;
import com.gaurav.atsanalyzer.dto.AnalyzeResponse;
import com.gaurav.atsanalyzer.security.AuthenticatedUser;
import com.gaurav.atsanalyzer.service.AnalyzeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/analyze")
@RequiredArgsConstructor
public class AnalyzeController {

    private final AnalyzeService analyzeService;

    @PostMapping
    public ResponseEntity<AnalyzeResponse> analyze(
            @Valid @RequestBody AnalyzeRequest request,
            @AuthenticationPrincipal AuthenticatedUser user) {

        log.info("Analyze request from user {} for ATS: {}", user.getId(), request.getAtsPlatform());
        AnalyzeResponse response = analyzeService.analyze(request, user.getId());
        return ResponseEntity.ok(response);
    }
}
