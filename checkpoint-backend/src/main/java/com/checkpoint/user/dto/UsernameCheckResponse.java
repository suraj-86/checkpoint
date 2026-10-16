package com.checkpoint.user.dto;

public record UsernameCheckResponse(String username, boolean available, String reason, String message) {
}
