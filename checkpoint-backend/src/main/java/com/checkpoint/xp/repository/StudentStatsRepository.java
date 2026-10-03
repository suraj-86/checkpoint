package com.checkpoint.xp.repository;

import com.checkpoint.xp.entity.StudentStats;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface StudentStatsRepository extends JpaRepository<StudentStats, UUID> {
    Optional<StudentStats> findByUserId(UUID userId);
}
