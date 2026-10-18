package com.checkpoint.support.controller;

import com.checkpoint.auth.security.CheckpointUserDetails;
import com.checkpoint.support.dto.SupportRequestCreate;
import com.checkpoint.support.dto.SupportRequestItem;
import com.checkpoint.support.service.SupportService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/help/requests")
public class HelpController {

    private final SupportService supportService;

    public HelpController(SupportService supportService) {
        this.supportService = supportService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SupportRequestItem create(
            @AuthenticationPrincipal CheckpointUserDetails principal,
            @RequestBody SupportRequestCreate request
    ) {
        return supportService.create(principal.getUser(), request);
    }

    @GetMapping
    public List<SupportRequestItem> mine(@AuthenticationPrincipal CheckpointUserDetails principal) {
        return supportService.listMine(principal.getUser());
    }
}
