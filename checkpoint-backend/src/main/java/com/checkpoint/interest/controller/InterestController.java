package com.checkpoint.interest.controller;

import com.checkpoint.auth.security.CheckpointUserDetails;
import com.checkpoint.interest.dto.InterestsRequest;
import com.checkpoint.interest.dto.InterestsResponse;
import com.checkpoint.interest.service.InterestService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/profile/interests")
public class InterestController {

    private final InterestService interestService;

    public InterestController(InterestService interestService) {
        this.interestService = interestService;
    }

    @GetMapping
    public InterestsResponse get(@AuthenticationPrincipal CheckpointUserDetails principal) {
        return interestService.get(principal.getUser());
    }

    @PutMapping
    public InterestsResponse replace(
            @AuthenticationPrincipal CheckpointUserDetails principal,
            @Valid @RequestBody InterestsRequest request
    ) {
        return interestService.replace(principal.getUser(), request.topicIds());
    }
}
