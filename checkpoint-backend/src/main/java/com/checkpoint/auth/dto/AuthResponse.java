package com.checkpoint.auth.dto;

public record AuthResponse(String accessToken, UserResponse user) {
}
