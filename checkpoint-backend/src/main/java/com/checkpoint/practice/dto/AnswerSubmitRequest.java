package com.checkpoint.practice.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record AnswerSubmitRequest(

        @NotNull(message = "questionId is required")
        UUID questionId,

        @NotNull(message = "answer is required")
        Object answer
) {
}
