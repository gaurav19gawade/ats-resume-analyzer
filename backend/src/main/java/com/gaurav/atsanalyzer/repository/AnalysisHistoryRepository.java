package com.gaurav.atsanalyzer.repository;

import com.gaurav.atsanalyzer.model.AnalysisHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AnalysisHistoryRepository extends JpaRepository<AnalysisHistory, UUID> {

    Page<AnalysisHistory> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    Optional<AnalysisHistory> findByIdAndUserId(UUID id, UUID userId);

    void deleteByIdAndUserId(UUID id, UUID userId);
}
