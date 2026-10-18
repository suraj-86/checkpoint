package com.checkpoint.support.dto;

import com.checkpoint.support.entity.SupportKind;
import com.checkpoint.support.entity.SupportRequest;
import com.checkpoint.support.entity.SupportStatus;

import java.time.Instant;
import java.util.UUID;

public record SupportRequestItem(
        UUID id,
        SupportKind kind,
        String subject,
        String message,
        SupportStatus status,
        Instant createdAt
) {
    public static SupportRequestItem from(SupportRequest r) {
        return new SupportRequestItem(r.getId(), r.getKind(), r.getSubject(), r.getMessage(), r.getStatus(), r.getCreatedAt());
    }
}
