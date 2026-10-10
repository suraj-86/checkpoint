package com.checkpoint.account.dto;

import com.checkpoint.user.entity.User;

import java.time.Instant;

public record AccountResponse(
        String username,
        String email,
        String role,
        String displayName,
        String bio,
        String goal,
        String avatarColor,
        Instant createdAt
) {
    public static AccountResponse from(User user) {
        return new AccountResponse(
                user.getUsername(),
                user.getEmail(),
                user.getRole().name(),
                user.getDisplayName(),
                user.getBio(),
                user.getGoal(),
                user.getAvatarColor(),
                user.getCreatedAt()
        );
    }
}
