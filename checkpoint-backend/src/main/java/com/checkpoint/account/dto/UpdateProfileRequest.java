package com.checkpoint.account.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(

        @Size(max = 60, message = "Display name must be at most 60 characters")
        String displayName,

        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email address")
        @Size(max = 255, message = "Email is too long")
        String email,

        @Size(max = 300, message = "Bio must be at most 300 characters")
        String bio,

        @Size(max = 100, message = "Goal must be at most 100 characters")
        String goal,

        @Size(max = 20, message = "Invalid avatar color")
        String avatarColor
) {
}
