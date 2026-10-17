package com.checkpoint.admin.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record MoveDatasetRequest(@NotNull(message = "Choose a topic") UUID topicId) {
}
