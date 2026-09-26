package com.checkpoint.auth.dto;

/**
 * Matches docs/05-API-Specification.md section 2 exactly:
 * { "accessToken": "...", "user": { "id", "username", "role" } }
 */
public record AuthResponse(String accessToken, UserResponse user) {
}
