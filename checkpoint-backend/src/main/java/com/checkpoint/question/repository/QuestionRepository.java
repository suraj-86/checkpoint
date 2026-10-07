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

    long countByActive(boolean active);

    @Query("SELECT q.difficulty, COUNT(q) FROM Question q WHERE q.active = true GROUP BY q.difficulty")
    List<Object[]> countActiveByDifficulty();

    @Query("SELECT q.questionType, COUNT(q) FROM Question q WHERE q.active = true GROUP BY q.questionType")
    List<Object[]> countActiveByType();

    @Query("""
            SELECT q.topic.name, COUNT(q) FROM Question q
            WHERE q.active = true
            GROUP BY q.topic.name
            ORDER BY COUNT(q) DESC, q.topic.name ASC
            """)
    List<Object[]> countActiveByTopic();

    @Query("""
            SELECT q.dataset.id, COUNT(q), COUNT(CASE WHEN q.active = true THEN 1 END)
            FROM Question q
            GROUP BY q.dataset.id
            """)
    List<Object[]> countPerDataset();

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
