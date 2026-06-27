package com.gaurav.atsanalyzer.controller;

import com.gaurav.atsanalyzer.dto.TemplateDto;
import com.gaurav.atsanalyzer.security.AuthenticatedUser;
import com.gaurav.atsanalyzer.service.TemplateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/templates")
@RequiredArgsConstructor
public class TemplateController {

    private final TemplateService templateService;

    @GetMapping
    public ResponseEntity<List<TemplateDto.Response>> getAll(
            @AuthenticationPrincipal AuthenticatedUser user) {
        return ResponseEntity.ok(templateService.getAll(user.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TemplateDto.Response> getById(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthenticatedUser user) {
        return ResponseEntity.ok(templateService.getById(id, user.getId()));
    }

    @PostMapping
    public ResponseEntity<TemplateDto.Response> create(
            @Valid @RequestBody TemplateDto.Request request,
            @AuthenticationPrincipal AuthenticatedUser user) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(templateService.create(request, user.getId()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TemplateDto.Response> update(
            @PathVariable UUID id,
            @Valid @RequestBody TemplateDto.Request request,
            @AuthenticationPrincipal AuthenticatedUser user) {
        return ResponseEntity.ok(templateService.update(id, request, user.getId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthenticatedUser user) {
        templateService.delete(id, user.getId());
        return ResponseEntity.noContent().build();
    }
}
