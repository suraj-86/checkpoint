package com.checkpoint.admin.dto;

import java.util.List;

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
