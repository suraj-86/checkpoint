package com.checkpoint.question.repository;

import com.checkpoint.question.entity.Question;
import com.checkpoint.topic.entity.Topic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface QuestionOrganiseRepository extends JpaRepository<Question, UUID> {

    @Query("""
            SELECT q.subtopic, COUNT(q) FROM Question q
            WHERE q.topic.id = :topicId AND q.subtopic IS NOT NULL AND q.subtopic <> ''
            GROUP BY q.subtopic
            """)
    List<Object[]> countBySubtopic(@Param("topicId") UUID topicId);

    long countByTopicId(UUID topicId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            UPDATE Question q SET q.topic = :target
            WHERE q.topic.id = :fromId AND lower(trim(q.subtopic)) = :key
            """)
    int moveBySubtopic(@Param("fromId") UUID fromId, @Param("target") Topic target, @Param("key") String key);
}
