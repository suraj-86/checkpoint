package com.checkpoint.support.dto;

import com.checkpoint.support.entity.SupportKind;
import com.checkpoint.support.entity.SupportRequest;
import com.checkpoint.support.entity.SupportStatus;

import java.time.Instant;
import java.util.UUID;

public record AdminSupportItem(
        UUID id,
        String username,
        SupportKind kind,
        String subject,
        String message,
        SupportStatus status,
        Instant createdAt,
        Instant resolvedAt
) {
    public static AdminSupportItem from(SupportRequest r) {
        return new AdminSupportItem(r.getId(), r.getUser().getUsername(), r.getKind(), r.getSubject(), r.getMessage(),
                r.getStatus(), r.getCreatedAt(), r.getResolvedAt());
    }
}
