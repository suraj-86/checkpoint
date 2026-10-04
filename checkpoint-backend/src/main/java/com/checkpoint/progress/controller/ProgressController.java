package com.checkpoint.progress.controller;

import com.checkpoint.auth.security.CheckpointUserDetails;
import com.checkpoint.common.dto.PageResponse;
import com.checkpoint.progress.dto.ActivityDayPoint;
import com.checkpoint.progress.dto.ProgressOverallResponse;
import com.checkpoint.progress.dto.SessionSummary;
import com.checkpoint.progress.dto.TopicPerformance;
import com.checkpoint.progress.service.ProgressService;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/progress")
public class ProgressController {

    private final ProgressService progressService;

    public ProgressController(ProgressService progressService) {
        this.progressService = progressService;
    }

    @GetMapping
    public ProgressOverallResponse getOverall(@AuthenticationPrincipal CheckpointUserDetails principal) {
        return progressService.getOverall(principal.getUser());
    }

    /** docs section 5: topic-level performance. */
    @GetMapping("/topics")
    public List<TopicPerformance> getTopics(@AuthenticationPrincipal CheckpointUserDetails principal) {
        return progressService.getTopicPerformance(principal.getUser());
    }

    /** Activity chart data; defaults to the last 30 days. */
    @GetMapping("/activity")
    public List<ActivityDayPoint> getActivity(
            @AuthenticationPrincipal CheckpointUserDetails principal,
            @RequestParam(defaultValue = "30") int days
    ) {
        return progressService.getActivity(principal.getUser(), days);
    }

    @GetMapping("/sessions")
    public PageResponse<SessionSummary> getSessionHistory(
            @AuthenticationPrincipal CheckpointUserDetails principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return progressService.getSessionHistory(principal.getUser(), pageable);
    }
}
