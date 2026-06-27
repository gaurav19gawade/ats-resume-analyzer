package com.gaurav.atsanalyzer.controller;

import com.gaurav.atsanalyzer.dto.HistoryDto;
import com.gaurav.atsanalyzer.security.AuthenticatedUser;
import com.gaurav.atsanalyzer.service.HistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/history")
@RequiredArgsConstructor
public class HistoryController {

    private final HistoryService historyService;

    @GetMapping
    public ResponseEntity<Page<HistoryDto.Summary>> getHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal AuthenticatedUser user) {
        return ResponseEntity.ok(historyService.getHistory(user.getId(), page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<HistoryDto.Detail> getDetail(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthenticatedUser user) {
        return ResponseEntity.ok(historyService.getDetail(id, user.getId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthenticatedUser user) {
        historyService.delete(id, user.getId());
        return ResponseEntity.noContent().build();
    }
}
