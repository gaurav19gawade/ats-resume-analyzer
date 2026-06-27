package com.gaurav.atsanalyzer.repository;

import com.gaurav.atsanalyzer.model.JdTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface JdTemplateRepository extends JpaRepository<JdTemplate, UUID> {

    List<JdTemplate> findByUserIdOrderByUpdatedAtDesc(UUID userId);

    Optional<JdTemplate> findByIdAndUserId(UUID id, UUID userId);

    boolean existsByIdAndUserId(UUID id, UUID userId);

    long countByUserId(UUID userId);
}
