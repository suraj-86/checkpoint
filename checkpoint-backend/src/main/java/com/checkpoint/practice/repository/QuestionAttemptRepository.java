package com.checkpoint.practice.repository;

import com.checkpoint.practice.entity.QuestionAttempt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface QuestionAttemptRepository extends JpaRepository<QuestionAttempt, UUID> {
}
