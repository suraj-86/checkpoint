package com.checkpoint.admin.controller;

import com.checkpoint.admin.dto.TopicMergeDtos.MergeRequest;
import com.checkpoint.admin.dto.TopicMergeDtos.MergeResult;
import com.checkpoint.admin.service.TopicMergeService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/catalog/topics")
public class AdminTopicMergeController {

    private final TopicMergeService service;

    public AdminTopicMergeController(TopicMergeService service) {
        this.service = service;
    }

    @PostMapping("/merge")
    public MergeResult merge(@RequestBody MergeRequest request) {
        return service.merge(request);
    }
}
