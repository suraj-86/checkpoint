package com.checkpoint.catalog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public record SubjectRequest(
        @NotBlank(message = "Name is required")
        @Size(min = 2, max = 100, message = "Name must be 2 to 100 characters")
        String name,

        @Size(max = 300, message = "Description can be at most 300 characters")
        String description,

        Integer sortOrder,

        Boolean active,

        List<UUID> streamIds,

        List<UUID> examIds
) {
}
