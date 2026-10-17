package com.checkpoint.practice.repository;

import com.checkpoint.practice.entity.SkippedQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface SkippedQuestionRepository extends JpaRepository<SkippedQuestion, UUID> {

    @Query("SELECT s FROM SkippedQuestion s JOIN FETCH s.question q JOIN FETCH q.topic "
            + "WHERE s.user.id = :userId ORDER BY s.skippedAt ASC")
    List<SkippedQuestion> findAllWithQuestion(@Param("userId") UUID userId);

    boolean existsByUserIdAndQuestionId(UUID userId, UUID questionId);

    void deleteByUserIdAndQuestionId(UUID userId, UUID questionId);
}
