package com.checkpoint.practice.repository;

import com.checkpoint.practice.entity.SessionQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SessionQuestionRepository extends JpaRepository<SessionQuestion, UUID> {

    List<SessionQuestion> findBySessionIdOrderByQueuePositionAsc(UUID sessionId);

    Optional<SessionQuestion> findFirstBySessionIdAndQuestionIdAndAnsweredFalseOrderByQueuePositionAsc(
            UUID sessionId, UUID questionId);

    Optional<SessionQuestion> findFirstBySessionIdAndAnsweredFalseOrderByQueuePositionAsc(UUID sessionId);

    boolean existsBySessionIdAndQuestionIdAndPrimaryFalse(UUID sessionId, UUID questionId);

    long countBySessionIdAndAnsweredTrue(UUID sessionId);

    long countBySessionIdAndPrimaryTrueAndAnsweredTrue(UUID sessionId);
}
