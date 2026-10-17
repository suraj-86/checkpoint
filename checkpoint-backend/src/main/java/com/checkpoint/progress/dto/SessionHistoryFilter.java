package com.checkpoint.progress.dto;

import com.checkpoint.practice.entity.SessionStatus;
import com.checkpoint.practice.entity.SessionType;

import java.time.Instant;
import java.util.UUID;

public record SessionHistoryFilter(
        SessionType type,
        SessionStatus status,
        UUID topicId,
        String text,
        Instant from,
        Instant to,
        String result,
        boolean oldestFirst
) {
}
