package com.checkpoint.admin.dto;

import java.util.List;

public record QuestionValidationError(String externalId, List<String> messages) {
}
