package com.checkpoint.progress.controller;

import com.checkpoint.auth.security.CheckpointUserDetails;
import com.checkpoint.progress.dto.DashboardResponse;
import com.checkpoint.progress.dto.ProfileResponse;
import com.checkpoint.progress.service.ProfileService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** docs/05-API-Specification.md section 3. ROLE_STUDENT-only, enforced in SecurityConfig. */
@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping
    public ProfileResponse getProfile(@AuthenticationPrincipal CheckpointUserDetails principal) {
        return profileService.getProfile(principal.getUser());
    }

    @GetMapping("/dashboard")
    public DashboardResponse getDashboard(@AuthenticationPrincipal CheckpointUserDetails principal) {
        return profileService.getDashboard(principal.getUser());
    }
}
