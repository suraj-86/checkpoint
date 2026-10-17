package com.checkpoint.admin.dto;

import java.util.UUID;

public record DatasetTopicRef(UUID topicId, String topicName, UUID subjectId, String subjectName, long questionCount) {
}
