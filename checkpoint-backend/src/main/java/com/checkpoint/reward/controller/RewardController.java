package com.checkpoint.reward.controller;

import com.checkpoint.auth.security.CheckpointUserDetails;
import com.checkpoint.reward.dto.RewardDtos.EquipRequest;
import com.checkpoint.reward.dto.RewardDtos.OpenChestResponse;
import com.checkpoint.reward.dto.RewardDtos.RewardsResponse;
import com.checkpoint.reward.service.RewardService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/rewards")
public class RewardController {

    private final RewardService rewardService;

    public RewardController(RewardService rewardService) {
        this.rewardService = rewardService;
    }

    @GetMapping
    public RewardsResponse get(@AuthenticationPrincipal CheckpointUserDetails principal) {
        return rewardService.get(principal.getUser().getId());
    }

    @PostMapping("/chests/{id}/open")
    public OpenChestResponse open(@AuthenticationPrincipal CheckpointUserDetails principal, @PathVariable UUID id) {
        return rewardService.openChest(principal.getUser().getId(), id);
    }

    @PutMapping("/equip")
    public RewardsResponse equip(
            @AuthenticationPrincipal CheckpointUserDetails principal,
            @RequestBody EquipRequest request
    ) {
        return rewardService.equip(principal.getUser().getId(), request.skin(), request.stickers());
    }
}
