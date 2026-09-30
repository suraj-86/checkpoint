package com.checkpoint.practice.dto;

public record AnswerResultResponse(
        boolean correct,
        Object correctAnswer,
        String explanation,
        boolean requeued
) {
}
