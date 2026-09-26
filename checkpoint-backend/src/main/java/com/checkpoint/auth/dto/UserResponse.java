package com.checkpoint.auth.dto;

import com.checkpoint.user.entity.Role;
import com.checkpoint.user.entity.User;

import java.util.UUID;

/**
 * Public-facing user shape. Deliberately excludes passwordHash, email,
 * and timestamps — never return more than the client needs
 * (docs/06-Authentication-and-Security.md, section 9: "Password exposure").
 */
public record UserResponse(UUID id, String username, Role role) {

    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getUsername(), user.getRole());
    }
}
