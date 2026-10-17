package com.checkpoint.catalog.dto;

import java.util.List;
import java.util.UUID;

public record CatalogResponse(List<StreamItem> streams, List<SubjectItem> subjects, List<ExamItem> exams) {

    public record StreamItem(UUID id, String name, String description, int sortOrder, boolean active, int subjectCount) {
    }

    public record ExamItem(UUID id, String name, String description, int sortOrder, boolean active, int subjectCount) {
    }

    public record SubjectItem(
            UUID id,
            String name,
            String description,
            int sortOrder,
            boolean active,
            List<UUID> streamIds,
            List<UUID> examIds,
            List<TopicItem> topics
    ) {
    }

    public record TopicItem(UUID id, String name, int sortOrder, boolean active, long questionCount, long activeQuestionCount) {
    }
}
