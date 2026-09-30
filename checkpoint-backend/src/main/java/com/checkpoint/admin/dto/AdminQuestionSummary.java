package com.checkpoint.admin.dto;

import com.checkpoint.question.entity.Question;

import java.util.UUID;

public record AdminQuestionSummary(
        UUID id,
        String externalId,
        String topic,
        String subtopic,
        String questionType,
        String difficulty,
        String questionText,
        Object answerData,
        String explanation,
        boolean active
) {
    public static AdminQuestionSummary from(Question q) {
        return new AdminQuestionSummary(
                q.getId(),
                q.getExternalId(),
                q.getTopic().getName(),
                q.getSubtopic(),
                q.getQuestionType().name(),
                q.getDifficulty().name(),
                q.getQuestionText(),
                q.getAnswerData(),
                q.getExplanation(),
                q.isActive()
        );
    }
}
