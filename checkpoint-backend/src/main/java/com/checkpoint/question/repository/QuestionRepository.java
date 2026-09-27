package com.checkpoint.question.repository;

import com.checkpoint.question.entity.Difficulty;
import com.checkpoint.question.entity.Question;
import com.checkpoint.question.entity.QuestionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface QuestionRepository extends JpaRepository<Question, UUID> {

    Optional<Question> findByDatasetIdAndExternalId(UUID datasetId, String externalId);

    /**
     * External IDs are a stable logical identity across dataset versions
     * (docs/07-Question-and-Dataset-Specification.md section 5 / section 6):
     * "JAVA-OOP-001 in version 1.1 is the same logical question as
     * JAVA-OOP-001 in version 1.0." So import matching looks up by
     * externalId alone, not scoped to one dataset, and re-points the
     * matched question at whichever dataset most recently updated it.
     */
    Optional<Question> findFirstByExternalId(String externalId);

    /**
     * Admin browser (docs/11-Admin-Operations.md section 9): filters by
     * topic/difficulty/type/active, all optional, with pagination.
     * Null parameters are ignored (each condition short-circuits to true).
     */
    @Query("""
            SELECT q FROM Question q
            WHERE (:topicId IS NULL OR q.topic.id = :topicId)
              AND (:difficulty IS NULL OR q.difficulty = :difficulty)
              AND (:questionType IS NULL OR q.questionType = :questionType)
              AND (:active IS NULL OR q.active = :active)
            ORDER BY q.createdAt DESC
            """)
    Page<Question> search(
            @Param("topicId") UUID topicId,
            @Param("difficulty") Difficulty difficulty,
            @Param("questionType") QuestionType questionType,
            @Param("active") Boolean active,
            Pageable pageable
    );
}
