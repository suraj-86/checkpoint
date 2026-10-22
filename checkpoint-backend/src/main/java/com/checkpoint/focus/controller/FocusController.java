package com.checkpoint.focus.controller;

import com.checkpoint.auth.security.CheckpointUserDetails;
import com.checkpoint.focus.dto.FocusResponse;
import com.checkpoint.focus.service.FocusService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Open to any signed-in user through the default authenticated rule. */
@RestController
@RequestMapping("/api/focus")
public class FocusController {

    private final FocusService focusService;

    public FocusController(FocusService focusService) {
        this.focusService = focusService;
    }

    @GetMapping
    public FocusResponse get(@AuthenticationPrincipal CheckpointUserDetails principal) {
        return focusService.get(principal.getUser().getId());
    }

    @PostMapping("/tick")
    public FocusResponse tick(@AuthenticationPrincipal CheckpointUserDetails principal) {
        return focusService.tick(principal.getUser().getId());
    }

    @PostMapping("/stop")
    public FocusResponse stop(@AuthenticationPrincipal CheckpointUserDetails principal) {
        return focusService.stop(principal.getUser().getId());
    }
}
