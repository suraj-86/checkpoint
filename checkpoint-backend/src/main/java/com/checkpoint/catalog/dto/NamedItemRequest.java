package com.checkpoint.catalog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record NamedItemRequest(
        @NotBlank(message = "Name is required")
        @Size(min = 2, max = 100, message = "Name must be 2 to 100 characters")
        String name,

        @Size(max = 300, message = "Description can be at most 300 characters")
        String description,

        Integer sortOrder,

        Boolean active
) {
}
