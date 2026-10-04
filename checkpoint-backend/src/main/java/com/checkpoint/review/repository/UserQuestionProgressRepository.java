package com.checkpoint.review.repository;

import com.checkpoint.review.entity.ReviewState;
import com.checkpoint.review.entity.UserQuestionProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserQuestionProgressRepository extends JpaRepository<UserQuestionProgress, UUID> {

    Optional<UserQuestionProgress> findByUserIdAndQuestionId(UUID userId, UUID questionId);

    /** Highest priority per docs/08-Review-Learning-Algorithm.md section 11: struggling questions. */
    @Query("""
            SELECT p FROM UserQuestionProgress p
            WHERE p.user.id = :userId AND p.reviewState = com.checkpoint.review.entity.ReviewState.NEEDS_REVIEW
            ORDER BY p.nextReviewAt ASC
            """)
    List<UserQuestionProgress> findNeedsReview(@Param("userId") UUID userId);

    /** Second priority: STABLE questions whose scheduled date has already passed. */
    @Query("""
            SELECT p FROM UserQuestionProgress p
            WHERE p.user.id = :userId AND p.reviewState = com.checkpoint.review.entity.ReviewState.STABLE
              AND p.nextReviewAt < :startOfToday
            ORDER BY p.nextReviewAt ASC
            """)
    List<UserQuestionProgress> findOverdue(@Param("userId") UUID userId, @Param("startOfToday") Instant startOfToday);

    /** Third priority: STABLE questions scheduled for today specifically. */
    @Query("""
            SELECT p FROM UserQuestionProgress p
            WHERE p.user.id = :userId AND p.reviewState = com.checkpoint.review.entity.ReviewState.STABLE
              AND p.nextReviewAt >= :startOfToday AND p.nextReviewAt < :startOfTomorrow
            ORDER BY p.nextReviewAt ASC
            """)
    List<UserQuestionProgress> findDueToday(
            @Param("userId") UUID userId,
            @Param("startOfToday") Instant startOfToday,
            @Param("startOfTomorrow") Instant startOfTomorrow
    );

    /**
     * Lowest priority: active questions this user has never answered at all
     * (no progress row exists — see ReviewState.NEW javadoc for why that's
     * the correct way to detect "new").
     */
    @Query("""
            SELECT q FROM Question q
            WHERE q.active = true
              AND q.id NOT IN (
                  SELECT p.question.id FROM UserQuestionProgress p WHERE p.user.id = :userId
              )
            ORDER BY q.createdAt ASC
            """)
    List<com.checkpoint.question.entity.Question> findNeverAttempted(@Param("userId") UUID userId);

    long countByUserIdAndReviewState(UUID userId, ReviewState reviewState);

    long countByUserId(UUID userId);

    /**
     * All of a student's progress rows, with Question and Topic fetched
     * eagerly in one query. Used for topic-level performance aggregation
     * (GET /api/progress/topics) — grouping happens in Java rather than
     * SQL, since the result set per student is small (bounded by the
     * question bank size) and this keeps the query simple and avoids an
     * N+1 on question.topic.name for each row.
     */
    @Query("""
            SELECT p FROM UserQuestionProgress p
            JOIN FETCH p.question q
            JOIN FETCH q.topic
            WHERE p.user.id = :userId
            """)
    List<UserQuestionProgress> findAllByUserIdWithQuestionAndTopic(@Param("userId") UUID userId);

    @Query("SELECT COALESCE(SUM(p.timesSeen), 0) FROM UserQuestionProgress p WHERE p.user.id = :userId")
    long sumTimesSeen(@Param("userId") UUID userId);

    @Query("SELECT COALESCE(SUM(p.timesCorrect), 0) FROM UserQuestionProgress p WHERE p.user.id = :userId")
    long sumTimesCorrect(@Param("userId") UUID userId);

    @Query("SELECT COALESCE(SUM(p.timesWrong), 0) FROM UserQuestionProgress p WHERE p.user.id = :userId")
    long sumTimesWrong(@Param("userId") UUID userId);
}
