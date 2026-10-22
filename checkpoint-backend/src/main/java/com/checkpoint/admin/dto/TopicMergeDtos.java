package com.checkpoint.admin.dto;

import java.util.List;
import java.util.UUID;

public final class TopicMergeDtos {

    private TopicMergeDtos() {
    }

    public record MergeRequest(UUID targetId, List<UUID> sourceIds, String newName) {
    }

    public record MergeResult(int questionsMoved, int topicsRemoved, String topicName) {
    }
}
