package com.checkpoint.admin.controller;

import com.checkpoint.admin.dto.AdminQuestionSummary;
import com.checkpoint.admin.service.QuestionAdminService;
import com.checkpoint.common.dto.PageResponse;
import com.checkpoint.question.entity.Difficulty;
import com.checkpoint.question.entity.QuestionType;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/questions")
public class AdminQuestionController {

    private final QuestionAdminService questionAdminService;

    public AdminQuestionController(QuestionAdminService questionAdminService) {
        this.questionAdminService = questionAdminService;
    }

    @GetMapping
    public ResponseEntity<PageResponse<AdminQuestionSummary>> search(
            @RequestParam(required = false) UUID topicId,
            @RequestParam(required = false) Difficulty difficulty,
            @RequestParam(required = false) QuestionType type,
            @RequestParam(required = false) Boolean active,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(questionAdminService.search(topicId, difficulty, type, active, pageable));
    }

    @PatchMapping("/{id}/retire")
    public ResponseEntity<AdminQuestionSummary> retire(@PathVariable UUID id) {
        return ResponseEntity.ok(questionAdminService.retire(id));
    }

    @PatchMapping("/{id}/restore")
    public ResponseEntity<AdminQuestionSummary> restore(@PathVariable UUID id) {
        return ResponseEntity.ok(questionAdminService.restore(id));
    }
}
