package com.checkpoint.admin.dto;

import com.checkpoint.question.entity.Difficulty;
import com.checkpoint.question.entity.QuestionType;

import java.util.UUID;

public record QuestionSearchFilter(
        UUID topicId,
        UUID subjectId,
        UUID streamId,
        UUID examId,
        UUID datasetId,
        Difficulty difficulty,
        QuestionType type,
        Boolean active,
        String text
) {
}
