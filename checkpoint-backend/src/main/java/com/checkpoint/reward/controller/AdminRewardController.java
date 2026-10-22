package com.checkpoint.reward.controller;

import com.checkpoint.reward.dto.AdminRewardDtos.AdminItemDto;
import com.checkpoint.reward.dto.AdminRewardDtos.AdminRewardsResponse;
import com.checkpoint.reward.dto.AdminRewardDtos.ItemUpdateRequest;
import com.checkpoint.reward.dto.AdminRewardDtos.MilestoneDto;
import com.checkpoint.reward.dto.AdminRewardDtos.MilestonesUpdateRequest;
import com.checkpoint.reward.dto.AdminRewardDtos.OddsDto;
import com.checkpoint.reward.dto.AdminRewardDtos.OddsUpdateRequest;
import com.checkpoint.reward.service.AdminRewardService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/** Covered by the existing /api/admin/** rule (ADMIN only). */
@RestController
@RequestMapping("/api/admin/rewards")
public class AdminRewardController {

    private final AdminRewardService service;

    public AdminRewardController(AdminRewardService service) {
        this.service = service;
    }

    @GetMapping
    public AdminRewardsResponse get() {
        return service.get();
    }

    @PutMapping("/items/{id}")
    public AdminItemDto updateItem(@PathVariable UUID id, @RequestBody ItemUpdateRequest request) {
        return service.updateItem(id, request);
    }

    @PutMapping("/odds")
    public List<OddsDto> updateOdds(@RequestBody OddsUpdateRequest request) {
        return service.updateOdds(request.odds());
    }

    @PutMapping("/milestones")
    public List<MilestoneDto> updateMilestones(@RequestBody MilestonesUpdateRequest request) {
        return service.updateMilestones(request.milestones());
    }
}
