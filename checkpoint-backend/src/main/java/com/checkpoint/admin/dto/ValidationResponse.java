package com.checkpoint.admin.dto;

import java.util.List;

/**
 * Shape matches what docs/11-Admin-Operations.md section 4 asks for:
 * total received, valid count, invalid count, and per-question reasons —
 * so the admin never has to read server logs to understand a failure.
 */
public record ValidationResponse(
        String datasetName,
        String datasetVersion,
        int total,
        int validCount,
        int invalidCount,
        List<QuestionValidationError> errors
) {
    public boolean allValid() {
        return invalidCount == 0;
    }
}
