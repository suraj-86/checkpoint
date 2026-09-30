package com.checkpoint.question.repository;

import com.checkpoint.question.entity.Difficulty;
import com.checkpoint.question.entity.Question;
import com.checkpoint.question.entity.QuestionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface QuestionRepository extends JpaRepository<Question, UUID> {

    Optional<Question> findByDatasetIdAndExternalId(UUID datasetId, String externalId);

    Optional<Question> findFirstByExternalId(String externalId);

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

    @Query(value = """
            SELECT * FROM questions q
            WHERE q.is_active = true
              AND (:topicId IS NULL OR q.topic_id = :topicId)
              AND (:difficulty IS NULL OR q.difficulty = :difficulty)
              AND (:questionType IS NULL OR q.question_type = :questionType)
            ORDER BY random()
            LIMIT :count
            """, nativeQuery = true)
    List<Question> findRandomActive(
            @Param("topicId") UUID topicId,
            @Param("difficulty") String difficulty,
            @Param("questionType") String questionType,
            @Param("count") int count
    );
}
