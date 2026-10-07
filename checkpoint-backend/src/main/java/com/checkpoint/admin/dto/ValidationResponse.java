package com.checkpoint.admin.dto;

import java.util.List;

public record ValidationResponse(
        String datasetName,
        String datasetVersion,
        int total,
        int validCount,
        int invalidCount,
        List<String> datasetErrors,
        List<QuestionValidationError> errors
) {
    public boolean allValid() {
        return invalidCount == 0 && datasetErrors.isEmpty();
    }
}
