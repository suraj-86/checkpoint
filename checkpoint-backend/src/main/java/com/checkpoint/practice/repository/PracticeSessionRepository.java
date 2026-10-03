package com.checkpoint.practice.repository;

import com.checkpoint.practice.entity.PracticeSession;
import com.checkpoint.practice.entity.SessionStatus;
import com.checkpoint.practice.entity.SessionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface PracticeSessionRepository extends JpaRepository<PracticeSession, UUID> {
    Optional<PracticeSession> findByUserIdAndStatus(UUID userId, SessionStatus status);

    @Query("""
            SELECT COALESCE(SUM(s.xpChange), 0) FROM PracticeSession s
            WHERE s.user.id = :userId
              AND s.sessionType = com.checkpoint.practice.entity.SessionType.FAST
              AND s.status = com.checkpoint.practice.entity.SessionStatus.COMPLETED
              AND s.xpChange > 0
              AND s.completedAt >= :startOfToday AND s.completedAt < :startOfTomorrow
            """)
    int sumPositiveFastXpToday(
            @Param("userId") UUID userId,
            @Param("startOfToday") Instant startOfToday,
            @Param("startOfTomorrow") Instant startOfTomorrow
    );
}
