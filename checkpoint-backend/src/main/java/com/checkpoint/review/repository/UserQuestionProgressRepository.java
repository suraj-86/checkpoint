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

    @Query("""
            SELECT p FROM UserQuestionProgress p
            WHERE p.user.id = :userId AND p.reviewState = com.checkpoint.review.entity.ReviewState.NEEDS_REVIEW
            ORDER BY p.nextReviewAt ASC
            """)
    List<UserQuestionProgress> findNeedsReview(@Param("userId") UUID userId);

    @Query("""
            SELECT p FROM UserQuestionProgress p
            WHERE p.user.id = :userId AND p.reviewState = com.checkpoint.review.entity.ReviewState.STABLE
              AND p.nextReviewAt < :startOfToday
            ORDER BY p.nextReviewAt ASC
            """)
    List<UserQuestionProgress> findOverdue(@Param("userId") UUID userId, @Param("startOfToday") Instant startOfToday);

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

    @Query("""
            SELECT q FROM Question q
            WHERE q.active = true
              AND q.id NOT IN (
                  SELECT p.question.id FROM UserQuestionProgress p WHERE p.user.id = :userId
              )
            ORDER BY q.createdAt ASC
            """)
    List<com.checkpoint.question.entity.Question> findNeverAttempted(@Param("userId") UUID userId);
}
