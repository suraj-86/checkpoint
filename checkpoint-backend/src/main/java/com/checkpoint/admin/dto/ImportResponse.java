package com.checkpoint.admin.dto;

public record ImportResponse(
        String datasetName,
        String datasetVersion,
        int totalProcessed,
        int created,
        int updated
) {
}
