package com.checkpoint.practice.dto;

import com.checkpoint.question.entity.Question;
import com.checkpoint.question.util.QuestionTypeCodec;

import java.util.List;
import java.util.UUID;

public record StudentQuestionResponse(
        UUID id,
        String question,
        List<String> options,
        String type,
        String difficulty
) {
    public static StudentQuestionResponse from(Question q, List<String> shuffledOptionsOrNull) {
        return new StudentQuestionResponse(
                q.getId(),
                q.getQuestionText(),
                shuffledOptionsOrNull,
                QuestionTypeCodec.encode(q.getQuestionType()),
                q.getDifficulty().name()
        );
    }
}
