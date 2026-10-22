package com.checkpoint.admin.controller;

import com.checkpoint.admin.dto.SubtopicOrganiseDtos.OrganiseRequest;
import com.checkpoint.admin.dto.SubtopicOrganiseDtos.OrganiseResult;
import com.checkpoint.admin.dto.SubtopicOrganiseDtos.Preview;
import com.checkpoint.admin.service.SubtopicOrganiseService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/catalog/subjects/{subjectId}")
public class AdminSubtopicController {

    private final SubtopicOrganiseService service;

    public AdminSubtopicController(SubtopicOrganiseService service) {
        this.service = service;
    }

    @GetMapping("/subtopics")
    public Preview preview(@PathVariable UUID subjectId) {
        return service.preview(subjectId);
    }

    @PostMapping("/organise")
    public OrganiseResult organise(@PathVariable UUID subjectId, @RequestBody OrganiseRequest request) {
        return service.organise(subjectId, request.moves());
    }
}
