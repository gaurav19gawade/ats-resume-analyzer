package com.gaurav.atsanalyzer.service;

import com.gaurav.atsanalyzer.dto.TemplateDto;
import com.gaurav.atsanalyzer.model.JdTemplate;
import com.gaurav.atsanalyzer.repository.JdTemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TemplateService {

    private static final int MAX_TEMPLATES_PER_USER = 50;

    private final JdTemplateRepository repository;

    public List<TemplateDto.Response> getAll(UUID userId) {
        return repository.findByUserIdOrderByUpdatedAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public TemplateDto.Response getById(UUID id, UUID userId) {
        return repository.findByIdAndUserId(id, userId)
                .map(this::toResponse)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Template not found"));
    }

    @Transactional
    public TemplateDto.Response create(TemplateDto.Request request, UUID userId) {
        long count = repository.countByUserId(userId);
        if (count >= MAX_TEMPLATES_PER_USER) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Maximum template limit (%d) reached".formatted(MAX_TEMPLATES_PER_USER));
        }

        JdTemplate template = JdTemplate.builder()
                .userId(userId)
                .name(request.getName().trim())
                .content(request.getContent().trim())
                .atsPlatform(request.getAtsPlatform())
                .build();

        return toResponse(repository.save(template));
    }

    @Transactional
    public TemplateDto.Response update(UUID id, TemplateDto.Request request, UUID userId) {
        JdTemplate template = repository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Template not found"));

        template.setName(request.getName().trim());
        template.setContent(request.getContent().trim());
        template.setAtsPlatform(request.getAtsPlatform());

        return toResponse(repository.save(template));
    }

    @Transactional
    public void delete(UUID id, UUID userId) {
        if (!repository.existsByIdAndUserId(id, userId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Template not found");
        }
        repository.deleteById(id);
    }

    private TemplateDto.Response toResponse(JdTemplate t) {
        TemplateDto.Response r = new TemplateDto.Response();
        r.setId(t.getId());
        r.setName(t.getName());
        r.setContent(t.getContent());
        r.setAtsPlatform(t.getAtsPlatform());
        r.setCreatedAt(t.getCreatedAt());
        r.setUpdatedAt(t.getUpdatedAt());
        return r;
    }
}
