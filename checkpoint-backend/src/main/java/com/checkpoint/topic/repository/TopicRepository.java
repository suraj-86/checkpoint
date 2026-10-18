package com.checkpoint.topic.repository;

import com.checkpoint.topic.entity.Topic;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TopicRepository extends JpaRepository<Topic, UUID> {
    List<Topic> findAllByNameOrderByCreatedAtAsc(String name);

    default Optional<Topic> findByName(String name) {
        return findAllByNameOrderByCreatedAtAsc(name).stream().findFirst();
    }

    boolean existsBySubjectIdAndNameIgnoreCase(UUID subjectId, String name);

    boolean existsBySubjectIdAndNameIgnoreCaseAndIdNot(UUID subjectId, String name, UUID id);

    List<Topic> findBySubjectId(UUID subjectId);
}
