package com.checkpoint.admin.dto;

import java.util.List;
import java.util.UUID;

public final class SubtopicOrganiseDtos {

    private SubtopicOrganiseDtos() {
    }

    public record SubtopicRow(String key, String label, long count) {
    }

    public record Preview(
            UUID subjectId,
            String subjectName,
            UUID generalTopicId,
            long generalQuestions,
            long withoutSubtopic,
            List<SubtopicRow> subtopics,
            List<String> existingTopics
    ) {
    }

    public record Move(String subtopic, String topicName) {
    }

    public record OrganiseRequest(List<Move> moves) {
    }

    public record OrganiseResult(int moved, List<String> topicsCreated) {
    }
}
