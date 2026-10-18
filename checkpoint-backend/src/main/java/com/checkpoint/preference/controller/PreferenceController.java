package com.checkpoint.preference.controller;

import com.checkpoint.auth.security.CheckpointUserDetails;
import com.checkpoint.preference.dto.PreferencesRequest;
import com.checkpoint.preference.dto.PreferencesResponse;
import com.checkpoint.preference.service.PreferenceService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/profile/preferences")
public class PreferenceController {

    private final PreferenceService preferenceService;

    public PreferenceController(PreferenceService preferenceService) {
        this.preferenceService = preferenceService;
    }

    @GetMapping
    public PreferencesResponse get(@AuthenticationPrincipal CheckpointUserDetails principal) {
        return preferenceService.get(principal.getUser());
    }

    @PutMapping
    public PreferencesResponse replace(
            @AuthenticationPrincipal CheckpointUserDetails principal,
            @RequestBody PreferencesRequest request
    ) {
        return preferenceService.replace(principal.getUser(), request.streamId(), request.examId(), request.subjectIds());
    }
}
