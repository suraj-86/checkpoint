package com.checkpoint.practice.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record FastPracticeStartRequest(

        @NotNull(message = "count is required")
        @Min(value = 1, message = "count must be at least 1")
        @Max(value = 100, message = "count must be at most 100")
        Integer count,

        UUID topicId,

        String difficulty,

        String questionType
) {
}
