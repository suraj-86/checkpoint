package com.checkpoint.common.exception;

import com.checkpoint.admin.dto.ValidationResponse;

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
