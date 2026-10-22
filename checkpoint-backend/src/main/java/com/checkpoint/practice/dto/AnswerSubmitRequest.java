package com.checkpoint.practice.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.util.UUID;

public record AnswerSubmitRequest(

        @NotNull(message = "questionId is required")
        UUID questionId,

        @NotNull(message = "answer is required")
        Object answer,

        @Pattern(regexp = "GUESS|UNSURE|SURE", message = "confidence must be GUESS, UNSURE or SURE")
        String confidence,

        @Min(value = 0, message = "timeTakenSeconds cannot be negative")
        @Max(value = 86_400, message = "timeTakenSeconds is too large")
        Integer timeTakenSeconds
) {

    public AnswerSubmitRequest(UUID questionId, Object answer) {
        this(questionId, answer, null, null);
    }
}
