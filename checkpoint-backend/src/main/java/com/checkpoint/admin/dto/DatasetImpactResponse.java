package com.checkpoint.admin.dto;

import java.util.UUID;

public record DatasetImpactResponse(
        UUID datasetId,
        String name,
        long questions,
        long activeQuestions,
        long attempts,
        long sessionEntries,
        long progressRows
) {
}
