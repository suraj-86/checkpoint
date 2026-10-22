package com.checkpoint.reward.service;

import com.checkpoint.common.exception.BadRequestException;
import com.checkpoint.common.exception.NotFoundException;
import com.checkpoint.reward.dto.AdminRewardDtos.AdminItemDto;
import com.checkpoint.reward.dto.AdminRewardDtos.AdminRewardsResponse;
import com.checkpoint.reward.dto.AdminRewardDtos.ItemUpdateRequest;
import com.checkpoint.reward.dto.AdminRewardDtos.MilestoneDto;
import com.checkpoint.reward.dto.AdminRewardDtos.OddsDto;
import com.checkpoint.reward.dto.AdminRewardDtos.StatsDto;
import com.checkpoint.reward.entity.ChestTier;
import com.checkpoint.reward.entity.RewardItem;
import com.checkpoint.reward.entity.RewardOdds;
import com.checkpoint.reward.entity.StreakMilestone;
import com.checkpoint.reward.repository.RewardItemRepository;
import com.checkpoint.reward.repository.RewardOddsRepository;
import com.checkpoint.reward.repository.StreakMilestoneRepository;
import com.checkpoint.reward.repository.UserBoostRepository;
import com.checkpoint.reward.repository.UserChestRepository;
import com.checkpoint.reward.repository.UserItemRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class AdminRewardService {

    private final RewardItemRepository itemRepository;
    private final RewardOddsRepository oddsRepository;
    private final StreakMilestoneRepository milestoneRepository;
    private final UserChestRepository chestRepository;
    private final UserItemRepository userItemRepository;
    private final UserBoostRepository boostRepository;

    public AdminRewardService(
            RewardItemRepository itemRepository,
            RewardOddsRepository oddsRepository,
            StreakMilestoneRepository milestoneRepository,
            UserChestRepository chestRepository,
            UserItemRepository userItemRepository,
            UserBoostRepository boostRepository
    ) {
        this.itemRepository = itemRepository;
        this.oddsRepository = oddsRepository;
        this.milestoneRepository = milestoneRepository;
        this.chestRepository = chestRepository;
        this.userItemRepository = userItemRepository;
        this.boostRepository = boostRepository;
    }

    @Transactional(readOnly = true)
    public AdminRewardsResponse get() {
        List<AdminItemDto> items = itemRepository.findAllByOrderByKindAscNameAsc().stream()
                .map(this::toItemDto)
                .toList();
        List<OddsDto> odds = oddsRepository.findAll().stream()
                .sorted((a, b) -> a.getTier().compareTo(b.getTier()))
                .map(AdminRewardService::toOddsDto)
                .toList();
        List<MilestoneDto> milestones = milestoneRepository.findAllByOrderByDaysAsc().stream()
                .map(AdminRewardService::toMilestoneDto)
                .toList();
        StatsDto stats = new StatsDto(chestRepository.count(), chestRepository.countByOpenedAtIsNotNull(),
                boostRepository.countByUsedAtIsNotNull());
        return new AdminRewardsResponse(items, odds, milestones, stats);
    }

    @Transactional
    public AdminItemDto updateItem(UUID id, ItemUpdateRequest request) {
        RewardItem item = itemRepository.findById(id).orElseThrow(() -> new NotFoundException("Reward item not found."));
        if (request.name() != null) {
            String name = request.name().trim();
            if (name.isEmpty() || name.length() > 60) {
                throw new BadRequestException("Name must be 1 to 60 characters.");
            }
            item.setName(name);
        }
        if (request.enabled() != null) {
            item.setEnabled(request.enabled());
        }
        return toItemDto(itemRepository.save(item));
    }

    @Transactional
    public List<OddsDto> updateOdds(List<OddsDto> odds) {
        if (odds == null || odds.isEmpty()) {
            throw new BadRequestException("Send at least one tier.");
        }
        Set<ChestTier> seen = new HashSet<>();
        for (OddsDto dto : odds) {
            ChestTier tier = parseTier(dto.tier());
            if (!seen.add(tier)) {
                throw new BadRequestException("Tier " + tier + " appears twice.");
            }
            if (dto.stickerPct() < 0 || dto.boostPct() < 0 || dto.skinPct() < 0
                    || dto.stickerPct() + dto.boostPct() + dto.skinPct() != 100) {
                throw new BadRequestException("The odds for " + tier + " must be zero or more and add up to 100.");
            }
            RewardOdds entity = oddsRepository.findById(tier).orElseGet(() -> RewardOdds.builder().tier(tier).build());
            entity.setStickerPct(dto.stickerPct());
            entity.setBoostPct(dto.boostPct());
            entity.setSkinPct(dto.skinPct());
            oddsRepository.save(entity);
        }
        return get().odds();
    }

    @Transactional
    public List<MilestoneDto> updateMilestones(List<MilestoneDto> milestones) {
        if (milestones == null) {
            throw new BadRequestException("Send the milestone list.");
        }
        Set<Integer> days = new HashSet<>();
        for (MilestoneDto dto : milestones) {
            if (dto.days() <= 0) {
                throw new BadRequestException("Milestone days must be greater than zero.");
            }
            if (!days.add(dto.days())) {
                throw new BadRequestException("Day " + dto.days() + " appears twice.");
            }
            parseTier(dto.tier());
        }

        Map<Integer, StreakMilestone> existing = milestoneRepository.findAll().stream()
                .collect(Collectors.toMap(StreakMilestone::getDays, Function.identity()));
        List<StreakMilestone> removed = existing.values().stream().filter(m -> !days.contains(m.getDays())).toList();
        milestoneRepository.deleteAll(removed);

        for (MilestoneDto dto : milestones) {
            StreakMilestone entity = existing.getOrDefault(dto.days(), StreakMilestone.builder().days(dto.days()).build());
            entity.setTier(parseTier(dto.tier()));
            entity.setEnabled(dto.enabled());
            milestoneRepository.save(entity);
        }
        return milestoneRepository.findAllByOrderByDaysAsc().stream().map(AdminRewardService::toMilestoneDto).toList();
    }

    private static ChestTier parseTier(String tier) {
        try {
            return ChestTier.valueOf(tier == null ? "" : tier.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Tier must be BRONZE, SILVER or GOLD.");
        }
    }

    private AdminItemDto toItemDto(RewardItem item) {
        return new AdminItemDto(item.getId(), item.getKind().name(), item.getCode(), item.getName(),
                item.isEnabled(), userItemRepository.countByItemId(item.getId()));
    }

    private static OddsDto toOddsDto(RewardOdds odds) {
        return new OddsDto(odds.getTier().name(), odds.getStickerPct(), odds.getBoostPct(), odds.getSkinPct());
    }

    private static MilestoneDto toMilestoneDto(StreakMilestone m) {
        return new MilestoneDto(m.getDays(), m.getTier().name(), m.isEnabled());
    }
}
