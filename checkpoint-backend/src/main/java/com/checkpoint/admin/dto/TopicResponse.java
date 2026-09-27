package com.checkpoint.admin.dto;

import com.checkpoint.topic.entity.Topic;

import java.util.UUID;

public record TopicResponse(UUID id, String name) {
    public static TopicResponse from(Topic topic) {
        return new TopicResponse(topic.getId(), topic.getName());
    }
}
