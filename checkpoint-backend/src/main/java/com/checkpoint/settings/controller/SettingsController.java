package com.checkpoint.settings.controller;

import com.checkpoint.auth.security.CheckpointUserDetails;
import com.checkpoint.settings.dto.SettingsRequest;
import com.checkpoint.settings.dto.SettingsResponse;
import com.checkpoint.settings.service.SettingsService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Look-and-feel settings. Open to any signed-in user, students and admins alike. */
@RestController
@RequestMapping("/api/settings")
public class SettingsController {

    private final SettingsService settingsService;

    public SettingsController(SettingsService settingsService) {
        this.settingsService = settingsService;
    }

    @GetMapping
    public SettingsResponse get(@AuthenticationPrincipal CheckpointUserDetails principal) {
        return settingsService.get(principal.getUser());
    }

    @PutMapping
    public SettingsResponse update(
            @AuthenticationPrincipal CheckpointUserDetails principal,
            @RequestBody SettingsRequest request
    ) {
        return settingsService.update(principal.getUser(), request);
    }
}
