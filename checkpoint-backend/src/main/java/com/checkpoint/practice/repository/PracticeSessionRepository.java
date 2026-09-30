package com.checkpoint.practice.repository;

import com.checkpoint.practice.entity.PracticeSession;
import com.checkpoint.practice.entity.SessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PracticeSessionRepository extends JpaRepository<PracticeSession, UUID> {
    Optional<PracticeSession> findByUserIdAndStatus(UUID userId, SessionStatus status);
}
