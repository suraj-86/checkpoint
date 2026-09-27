package com.checkpoint.topic.controller;

import com.checkpoint.admin.dto.TopicResponse;
import com.checkpoint.topic.repository.TopicRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * docs/05-API-Specification.md section 6: "Returns active topics available
 * for practice filters." Our schema has no per-topic active flag (a topic
 * is just a label questions reference), so this returns all topics —
 * every topic returned here has at least the possibility of active
 * questions once Phase 3's seed data / future imports populate it.
 */
@RestController
@RequestMapping("/api/topics")
public class TopicController {

    private final TopicRepository topicRepository;

    public TopicController(TopicRepository topicRepository) {
        this.topicRepository = topicRepository;
    }

    @GetMapping
    public ResponseEntity<List<TopicResponse>> listTopics() {
        List<TopicResponse> topics = topicRepository.findAll().stream()
                .map(TopicResponse::from)
                .toList();
        return ResponseEntity.ok(topics);
    }
}
