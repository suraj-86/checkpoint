package com.checkpoint.interest.dto;

import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public record InterestsRequest(
        @NotNull(message = "topicIds is required")
        List<UUID> topicIds
) {
}
