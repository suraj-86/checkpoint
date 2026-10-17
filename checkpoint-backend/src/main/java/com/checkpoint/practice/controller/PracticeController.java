package com.checkpoint.practice.controller;

import com.checkpoint.auth.security.CheckpointUserDetails;
import com.checkpoint.practice.dto.*;
import com.checkpoint.practice.service.PracticeSessionService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/practice")
public class PracticeController {

    private final PracticeSessionService practiceSessionService;

    public PracticeController(PracticeSessionService practiceSessionService) {
        this.practiceSessionService = practiceSessionService;
    }

    @PostMapping("/daily/start")
    public ActiveSessionResponse startDaily(@AuthenticationPrincipal CheckpointUserDetails principal) {
        return practiceSessionService.startDaily(principal.getUser());
    }

    @PostMapping("/fast/start")
    public ActiveSessionResponse startFast(
            @AuthenticationPrincipal CheckpointUserDetails principal,
            @Valid @RequestBody FastPracticeStartRequest request
    ) {
        return practiceSessionService.startFast(principal.getUser(), request);
    }

    @GetMapping("/active")
    public ActiveSessionResponse getActive(@AuthenticationPrincipal CheckpointUserDetails principal) {
        return practiceSessionService.getActive(principal.getUser());
    }

    @PostMapping("/{sessionId}/answer")
    public AnswerResultResponse answer(
            @AuthenticationPrincipal CheckpointUserDetails principal,
            @PathVariable UUID sessionId,
            @Valid @RequestBody AnswerSubmitRequest request
    ) {
        return practiceSessionService.submitAnswer(principal.getUser(), sessionId, request);
    }

    @PostMapping("/{sessionId}/complete")
    public SessionCompletionResponse complete(
            @AuthenticationPrincipal CheckpointUserDetails principal,
            @PathVariable UUID sessionId
    ) {
        return practiceSessionService.completeSession(principal.getUser(), sessionId);
    }

    @PostMapping("/{sessionId}/abandon")
    public SessionAbandonResponse abandon(
            @AuthenticationPrincipal CheckpointUserDetails principal,
            @PathVariable UUID sessionId
    ) {
        return practiceSessionService.abandonSession(principal.getUser(), sessionId);
    }

    @GetMapping("/{sessionId}/overview")
    public ActiveSessionResponse overview(
            @AuthenticationPrincipal CheckpointUserDetails principal,
            @PathVariable UUID sessionId
    ) {
        return practiceSessionService.getOverview(principal.getUser(), sessionId);
    }

    @GetMapping("/{sessionId}/slots/{position}")
    public SlotQuestionResponse slot(
            @AuthenticationPrincipal CheckpointUserDetails principal,
            @PathVariable UUID sessionId,
            @PathVariable int position
    ) {
        return practiceSessionService.getSlot(principal.getUser(), sessionId, position);
    }

    @PostMapping("/{sessionId}/slots/{position}/skip")
    public ActiveSessionResponse skip(
            @AuthenticationPrincipal CheckpointUserDetails principal,
            @PathVariable UUID sessionId,
            @PathVariable int position
    ) {
        return practiceSessionService.skipSlot(principal.getUser(), sessionId, position);
    }
}
