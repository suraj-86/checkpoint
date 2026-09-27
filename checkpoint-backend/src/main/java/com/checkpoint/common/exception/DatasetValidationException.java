package com.checkpoint.common.exception;

import com.checkpoint.admin.dto.ValidationResponse;

/**
 * Thrown when POST /api/admin/datasets/import is called on a dataset that
 * fails re-validation (docs/07-Question-and-Dataset-Specification.md
 * section 8: the server always validates again at import time, in case
 * the file changed between validate and import calls). Carries the full
 * ValidationResponse so the admin gets the same detailed error breakdown
 * they'd get from a plain validate call.
 */
public class DatasetValidationException extends RuntimeException {

    private final ValidationResponse validationResponse;

    public DatasetValidationException(ValidationResponse validationResponse) {
        super("Dataset failed validation: " + validationResponse.invalidCount() + " invalid question(s).");
        this.validationResponse = validationResponse;
    }

    public ValidationResponse getValidationResponse() {
        return validationResponse;
    }
}
