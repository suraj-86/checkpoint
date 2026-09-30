package com.checkpoint.auth.dto;

import com.checkpoint.user.entity.Role;
import com.checkpoint.user.entity.User;

import java.util.UUID;

public record UserResponse(UUID id, String username, Role role) {

    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getUsername(), user.getRole());
    }
}
