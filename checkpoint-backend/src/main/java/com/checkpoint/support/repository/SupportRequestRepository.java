package com.checkpoint.support.repository;

import com.checkpoint.support.entity.SupportRequest;
import com.checkpoint.support.entity.SupportStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface SupportRequestRepository extends JpaRepository<SupportRequest, UUID> {

    List<SupportRequest> findTop20ByUserIdOrderByCreatedAtDesc(UUID userId);

    long countByUserIdAndCreatedAtAfter(UUID userId, Instant since);

    @EntityGraph(attributePaths = "user")
    Page<SupportRequest> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @EntityGraph(attributePaths = "user")
    Page<SupportRequest> findByStatusOrderByCreatedAtDesc(SupportStatus status, Pageable pageable);

    long countByStatus(SupportStatus status);
}
