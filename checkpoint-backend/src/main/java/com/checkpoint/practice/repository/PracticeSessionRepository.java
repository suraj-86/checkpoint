package com.checkpoint.practice.repository;

import com.checkpoint.practice.entity.PracticeSession;
import com.checkpoint.practice.entity.SessionStatus;
import com.checkpoint.practice.entity.SessionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PracticeSessionRepository
        extends JpaRepository<PracticeSession, UUID>, JpaSpecificationExecutor<PracticeSession> {
    Optional<PracticeSession> findByUserIdAndStatus(UUID userId, SessionStatus status);

    Page<PracticeSession> findByUserIdOrderByStartedAtDesc(UUID userId, Pageable pageable);

    List<PracticeSession> findTop5ByUserIdAndStatusOrderByCompletedAtDesc(UUID userId, SessionStatus status);

    long countByUserIdAndSessionTypeAndStatus(UUID userId, SessionType sessionType, SessionStatus status);

    @Query("""
            SELECT COUNT(s) > 0 FROM PracticeSession s
            WHERE s.user.id = :userId AND s.sessionType = com.checkpoint.practice.entity.SessionType.DAILY
              AND s.status = com.checkpoint.practice.entity.SessionStatus.COMPLETED
              AND s.completedAt >= :startOfToday AND s.completedAt < :startOfTomorrow
            """)
    boolean existsCompletedDailySessionToday(
            @Param("userId") UUID userId,
            @Param("startOfToday") Instant startOfToday,
            @Param("startOfTomorrow") Instant startOfTomorrow
    );

    @Query(value = """
            SELECT CAST(completed_at AT TIME ZONE 'UTC' AS date) AS activity_date,
                   COUNT(*) AS session_count,
                   COALESCE(SUM(xp_change), 0) AS xp_total
            FROM practice_sessions
            WHERE user_id = :userId AND status = 'COMPLETED' AND completed_at >= :since
            GROUP BY activity_date
            ORDER BY activity_date ASC
            """, nativeQuery = true)
    List<Object[]> findActivitySince(@Param("userId") UUID userId, @Param("since") Instant since);

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
