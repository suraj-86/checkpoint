package com.checkpoint.progress.controller;

import com.checkpoint.auth.security.CheckpointUserDetails;
import com.checkpoint.common.dto.PageResponse;
import com.checkpoint.progress.dto.ActivityDayPoint;
import com.checkpoint.progress.dto.ProgressOverallResponse;
import com.checkpoint.progress.dto.SessionSummary;
import com.checkpoint.progress.dto.TopicPerformance;
import com.checkpoint.progress.dto.SessionDetailResponse;
import com.checkpoint.progress.dto.MasteryResponse;
import com.checkpoint.progress.service.MasteryService;
import com.checkpoint.progress.service.ProgressService;
import com.checkpoint.progress.service.SessionDetailService;
import org.springframework.web.bind.annotation.PathVariable;
import com.checkpoint.practice.entity.SessionStatus;
import com.checkpoint.practice.entity.SessionType;
import com.checkpoint.progress.dto.SessionHistoryFilter;
import com.checkpoint.progress.dto.SessionHistoryItem;
import com.checkpoint.progress.service.SessionHistoryService;
import java.time.Instant;
import java.util.UUID;
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
    private final SessionDetailService sessionDetailService;
    private final SessionHistoryService sessionHistoryService;
    private final MasteryService masteryService;

    public ProgressController(ProgressService progressService, SessionDetailService sessionDetailService,
                              SessionHistoryService sessionHistoryService, MasteryService masteryService) {
        this.progressService = progressService;
        this.sessionDetailService = sessionDetailService;
        this.sessionHistoryService = sessionHistoryService;
        this.masteryService = masteryService;
    }

    @GetMapping
    public ProgressOverallResponse getOverall(@AuthenticationPrincipal CheckpointUserDetails principal) {
        return progressService.getOverall(principal.getUser());
    }

    @GetMapping("/topics")
    public List<TopicPerformance> getTopics(@AuthenticationPrincipal CheckpointUserDetails principal) {
        return progressService.getTopicPerformance(principal.getUser());
    }

    @GetMapping("/mastery")
    public MasteryResponse getMastery(@AuthenticationPrincipal CheckpointUserDetails principal) {
        return masteryService.getMastery(principal.getUser());
    }

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

    @GetMapping("/sessions/{sessionId}")
    public SessionDetailResponse getSessionDetail(
            @AuthenticationPrincipal CheckpointUserDetails principal,
            @PathVariable UUID sessionId
    ) {
        return sessionDetailService.getDetail(principal.getUser(), sessionId);
    }

    @GetMapping("/history")
    public PageResponse<SessionHistoryItem> searchHistory(
            @AuthenticationPrincipal CheckpointUserDetails principal,
            @RequestParam(required = false) SessionType type,
            @RequestParam(required = false) SessionStatus status,
            @RequestParam(required = false) UUID topicId,
            @RequestParam(required = false) UUID subjectId,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to,
            @RequestParam(required = false) String result,
            @RequestParam(defaultValue = "newest") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size
    ) {
        SessionHistoryFilter filter = new SessionHistoryFilter(
                type, status, topicId, subjectId, q, from, to, result, "oldest".equalsIgnoreCase(sort));
        return sessionHistoryService.search(principal.getUser(), filter, page, size);
    }
}
