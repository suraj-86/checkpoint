package com.checkpoint.common.dto;

import java.time.Instant;
import java.util.Map;

public record ErrorResponse(
        Instant timestamp,
        int status,
        String code,
        String message,
        String path,
        Map<String, String> errors
) {
    public static ErrorResponse of(int status, String code, String message, String path) {
        return new ErrorResponse(Instant.now(), status, code, message, path, null);
    }

    public static ErrorResponse validation(String message, String path, Map<String, String> errors) {
        return new ErrorResponse(Instant.now(), 400, "VALIDATION_ERROR", message, path, errors);
    }
}
