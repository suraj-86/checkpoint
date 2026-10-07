package com.checkpoint.question.repository;

import com.checkpoint.question.entity.QuestionDataset;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface QuestionDatasetRepository extends JpaRepository<QuestionDataset, UUID> {
    Optional<QuestionDataset> findByNameAndVersion(String name, String version);

    List<QuestionDataset> findAllByOrderByImportedAtDesc();
}
