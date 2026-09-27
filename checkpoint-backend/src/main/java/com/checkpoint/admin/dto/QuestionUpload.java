package com.checkpoint.admin.dto;

import java.util.List;

/**
 * Mirrors the raw JSON shape from docs/07-Question-and-Dataset-Specification.md
 * section 6 exactly. "type" arrives as "MCQ" / "TRUE_FALSE" / "FILL_IN_BLANK"
 * (not the internal enum name) and "answer" varies by type:
 * - MCQ: a String matching one of "options"
 * - TRUE_FALSE: a Boolean
 * - FILL_IN_BLANK: a List of accepted Strings
 */
public record QuestionUpload(
        String externalId,
        String topic,
        String subtopic,
        String type,
        String difficulty,
        String question,
        List<String> options,
        Object answer,
        String explanation
) {
}
