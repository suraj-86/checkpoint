package com.checkpoint.practice.repository;

import com.checkpoint.practice.entity.PracticeSession;
import com.checkpoint.practice.entity.SessionStatus;
import com.checkpoint.practice.entity.SessionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PracticeSessionRepository extends JpaRepository<PracticeSession, UUID> {
    Optional<PracticeSession> findByUserIdAndStatus(UUID userId, SessionStatus status);

    /** GET /api/progress/sessions — paginated history, newest first. */
    Page<PracticeSession> findByUserIdOrderByStartedAtDesc(UUID userId, Pageable pageable);

    /** Dashboard's "recent activity" — a short, unpaginated list. */
    List<PracticeSession> findTop5ByUserIdAndStatusOrderByCompletedAtDesc(UUID userId, SessionStatus status);

    long countByUserIdAndSessionTypeAndStatus(UUID userId, SessionType sessionType, SessionStatus status);

    /**
     * Whether a qualifying (completed) Daily Session already happened
     * today — used by the dashboard to show "today's session: done" vs
     * "not yet," independent of StudentStats.lastDailySessionDate (which
     * this mirrors, but querying sessions directly avoids a dependency
     * between the progress module and the xp module's entity).
     */
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

    /**
     * Activity chart data (GET /api/progress/activity): one row per
     * calendar day with at least one completed session, for the given
     * window. A native query is used for date_trunc, which has no
     * portable JPQL equivalent — same trade-off as findRandomActive in
     * QuestionRepository (Postgres is this project's one supported DB).
     */
    @Query(value = """
            SELECT date_trunc('day', completed_at) AS activity_date,
                   COUNT(*) AS session_count,
                   COALESCE(SUM(xp_change), 0) AS xp_total
            FROM practice_sessions
            WHERE user_id = :userId AND status = 'COMPLETED' AND completed_at >= :since
            GROUP BY activity_date
            ORDER BY activity_date ASC
            """, nativeQuery = true)
    List<Object[]> findActivitySince(@Param("userId") UUID userId, @Param("since") Instant since);

    /**
     * Fast Practice daily positive-XP cap (docs/09-XP-Level-Progression.md
     * section 13): sums only POSITIVE xpChange from today's already-
     * completed Fast Practice sessions, so negative-XP sessions never
     * reduce the running total (a loss doesn't "free up" cap room). The
     * session currently being completed is naturally excluded, since its
     * xpChange isn't set/saved until after this query runs.
     */
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
