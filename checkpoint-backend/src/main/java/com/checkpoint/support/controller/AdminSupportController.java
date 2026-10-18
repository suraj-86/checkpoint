package com.checkpoint.support.controller;

import com.checkpoint.common.dto.PageResponse;
import com.checkpoint.support.dto.AdminSupportItem;
import com.checkpoint.support.dto.SupportStatusUpdate;
import com.checkpoint.support.service.SupportService;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/support")
public class AdminSupportController {

    private final SupportService supportService;

    public AdminSupportController(SupportService supportService) {
        this.supportService = supportService;
    }

    @GetMapping
    public PageResponse<AdminSupportItem> list(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return supportService.adminList(status, PageRequest.of(Math.max(0, page), Math.min(Math.max(1, size), 50)));
    }

    @GetMapping("/open-count")
    public Map<String, Long> openCount() {
        return Map.of("open", supportService.openCount());
    }

    @PatchMapping("/{id}")
    public AdminSupportItem setStatus(@PathVariable UUID id, @RequestBody SupportStatusUpdate update) {
        return supportService.setStatus(id, update.status());
    }
}
