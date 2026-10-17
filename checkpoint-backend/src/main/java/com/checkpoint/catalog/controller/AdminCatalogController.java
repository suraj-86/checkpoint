package com.checkpoint.catalog.controller;

import com.checkpoint.catalog.dto.CatalogResponse;
import com.checkpoint.catalog.dto.IdListRequest;
import com.checkpoint.catalog.dto.NamedItemRequest;
import com.checkpoint.catalog.dto.SubjectRequest;
import com.checkpoint.catalog.dto.TopicRequest;
import com.checkpoint.catalog.service.CatalogService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/catalog")
public class AdminCatalogController {

    private final CatalogService catalogService;

    public AdminCatalogController(CatalogService catalogService) {
        this.catalogService = catalogService;
    }

    @GetMapping
    public ResponseEntity<CatalogResponse> get() {
        return ResponseEntity.ok(catalogService.snapshot());
    }

    @PostMapping("/streams")
    public ResponseEntity<CatalogResponse> createStream(@Valid @RequestBody NamedItemRequest request) {
        return ResponseEntity.ok(catalogService.createStream(request));
    }

    @PutMapping("/streams/{id}")
    public ResponseEntity<CatalogResponse> updateStream(@PathVariable UUID id, @Valid @RequestBody NamedItemRequest request) {
        return ResponseEntity.ok(catalogService.updateStream(id, request));
    }

    @DeleteMapping("/streams/{id}")
    public ResponseEntity<CatalogResponse> deleteStream(@PathVariable UUID id) {
        return ResponseEntity.ok(catalogService.deleteStream(id));
    }

    @PutMapping("/streams/{id}/subjects")
    public ResponseEntity<CatalogResponse> setStreamSubjects(@PathVariable UUID id, @RequestBody IdListRequest request) {
        return ResponseEntity.ok(catalogService.setStreamSubjects(id, request.ids()));
    }

    @PutMapping("/exams/{id}/subjects")
    public ResponseEntity<CatalogResponse> setExamSubjects(@PathVariable UUID id, @RequestBody IdListRequest request) {
        return ResponseEntity.ok(catalogService.setExamSubjects(id, request.ids()));
    }

    @PostMapping("/topics")
    public ResponseEntity<CatalogResponse> createTopicInSubject(@Valid @RequestBody TopicRequest request) {
        return ResponseEntity.ok(catalogService.createTopic(request));
    }

    @PostMapping("/exams")
    public ResponseEntity<CatalogResponse> createExam(@Valid @RequestBody NamedItemRequest request) {
        return ResponseEntity.ok(catalogService.createExam(request));
    }

    @PutMapping("/exams/{id}")
    public ResponseEntity<CatalogResponse> updateExam(@PathVariable UUID id, @Valid @RequestBody NamedItemRequest request) {
        return ResponseEntity.ok(catalogService.updateExam(id, request));
    }

    @DeleteMapping("/exams/{id}")
    public ResponseEntity<CatalogResponse> deleteExam(@PathVariable UUID id) {
        return ResponseEntity.ok(catalogService.deleteExam(id));
    }

    @PostMapping("/subjects")
    public ResponseEntity<CatalogResponse> createSubject(@Valid @RequestBody SubjectRequest request) {
        return ResponseEntity.ok(catalogService.createSubject(request));
    }

    @PutMapping("/subjects/{id}")
    public ResponseEntity<CatalogResponse> updateSubject(@PathVariable UUID id, @Valid @RequestBody SubjectRequest request) {
        return ResponseEntity.ok(catalogService.updateSubject(id, request));
    }

    @DeleteMapping("/subjects/{id}")
    public ResponseEntity<CatalogResponse> deleteSubject(@PathVariable UUID id) {
        return ResponseEntity.ok(catalogService.deleteSubject(id));
    }

    @PostMapping("/subjects/{subjectId}/topics")
    public ResponseEntity<CatalogResponse> createTopic(@PathVariable UUID subjectId, @Valid @RequestBody TopicRequest request) {
        return ResponseEntity.ok(catalogService.createTopic(subjectId, request));
    }

    @PutMapping("/topics/{id}")
    public ResponseEntity<CatalogResponse> updateTopic(@PathVariable UUID id, @Valid @RequestBody TopicRequest request) {
        return ResponseEntity.ok(catalogService.updateTopic(id, request));
    }

    @DeleteMapping("/topics/{id}")
    public ResponseEntity<CatalogResponse> deleteTopic(@PathVariable UUID id) {
        return ResponseEntity.ok(catalogService.deleteTopic(id));
    }
}
