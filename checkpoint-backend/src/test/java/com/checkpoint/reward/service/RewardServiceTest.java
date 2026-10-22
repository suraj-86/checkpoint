package com.checkpoint.reward.service;

import com.checkpoint.common.exception.ConflictException;
import com.checkpoint.reward.dto.RewardDtos.OpenChestResponse;
import com.checkpoint.reward.dto.SessionRewards;
import com.checkpoint.reward.entity.BoostType;
import com.checkpoint.reward.entity.ChestSource;
import com.checkpoint.reward.entity.ChestTier;
import com.checkpoint.reward.entity.RewardItem;
import com.checkpoint.reward.entity.RewardKind;
import com.checkpoint.reward.entity.RewardOdds;
import com.checkpoint.reward.entity.StreakMilestone;
import com.checkpoint.reward.entity.UserBoost;
import com.checkpoint.reward.entity.UserChest;
import com.checkpoint.reward.entity.UserItem;
import com.checkpoint.reward.repository.RewardItemRepository;
import com.checkpoint.reward.repository.RewardLoadoutRepository;
import com.checkpoint.reward.repository.RewardOddsRepository;
import com.checkpoint.reward.repository.StreakMilestoneRepository;
import com.checkpoint.reward.repository.UserBoostRepository;
import com.checkpoint.reward.repository.UserChestRepository;
import com.checkpoint.reward.repository.UserItemRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.Random;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RewardServiceTest {

    private static final Instant NOW = Instant.parse("2026-10-19T10:00:00Z");

    @Mock
    private RewardItemRepository itemRepository;
    @Mock
    private RewardOddsRepository oddsRepository;
    @Mock
    private StreakMilestoneRepository milestoneRepository;
    @Mock
    private UserChestRepository chestRepository;
    @Mock
    private UserItemRepository userItemRepository;
    @Mock
    private UserBoostRepository boostRepository;
    @Mock
    private RewardLoadoutRepository loadoutRepository;

    private final UUID userId = UUID.randomUUID();
    private final UUID sessionId = UUID.randomUUID();
    private RewardService service;

    @BeforeEach
    void setUp() {
        service = new RewardService(itemRepository, oddsRepository, milestoneRepository, chestRepository,
                userItemRepository, boostRepository, loadoutRepository, Clock.fixed(NOW, ZoneOffset.UTC));
    }

    private void saveChestsWithIds() {
        when(chestRepository.save(any(UserChest.class))).thenAnswer(inv -> {
            UserChest chest = inv.getArgument(0);
            if (chest.getId() == null) {
                chest.setId(UUID.randomUUID());
            }
            return chest;
        });
    }

    @Test
    void chestTierFollowsPerformance() {
        assertThat(RewardService.tierForPerformance(100.0)).isEqualTo(ChestTier.GOLD);
        assertThat(RewardService.tierForPerformance(92.5)).isEqualTo(ChestTier.SILVER);
        assertThat(RewardService.tierForPerformance(75.0)).isEqualTo(ChestTier.BRONZE);
        assertThat(RewardService.tierForPerformance(74.9)).isNull();
    }

    @Test
    void sessionWithTenAnswersAndGoodResultEarnsAChest() {
        saveChestsWithIds();

        SessionRewards rewards = service.onSessionCompleted(userId, sessionId, true, 10, 92.0, 0, 0);

        assertThat(rewards.chestEarned()).isNotNull();
        assertThat(rewards.chestEarned().tier()).isEqualTo("SILVER");
        assertThat(rewards.chestEarned().reason()).isEqualTo("SESSION");
        ArgumentCaptor<UserChest> captor = ArgumentCaptor.forClass(UserChest.class);
        verify(chestRepository).save(captor.capture());
        assertThat(captor.getValue().getSource()).isEqualTo(ChestSource.SESSION_DAILY);
        assertThat(captor.getValue().getSourceKey()).isEqualTo("session:" + sessionId);
    }

    @Test
    void shortSessionOrWeakResultEarnsNoChest() {
        assertThat(service.onSessionCompleted(userId, sessionId, true, 9, 100.0, 0, 0).chestEarned()).isNull();
        assertThat(service.onSessionCompleted(userId, sessionId, true, 12, 60.0, 0, 0).chestEarned()).isNull();
        verify(chestRepository, never()).save(any(UserChest.class));
    }

    @Test
    void grantIsIdempotentForTheSameSession() {
        when(chestRepository.existsByUserIdAndSourceKey(userId, "session:" + sessionId)).thenReturn(true);

        SessionRewards rewards = service.onSessionCompleted(userId, sessionId, false, 10, 100.0, 0, 0);

        assertThat(rewards.chestEarned()).isNull();
        verify(chestRepository, never()).save(any(UserChest.class));
    }

    @Test
    void onlyOneSessionChestPerSourcePerDay() {
        when(chestRepository.countByUserIdAndSourceAndEarnedAtGreaterThanEqualAndEarnedAtLessThan(
                eq(userId), eq(ChestSource.SESSION_FAST), any(Instant.class), any(Instant.class))).thenReturn(1L);

        SessionRewards rewards = service.onSessionCompleted(userId, sessionId, false, 10, 100.0, 0, 0);

        assertThat(rewards.chestEarned()).isNull();
        verify(chestRepository, never()).save(any(UserChest.class));
    }

    @Test
    void streakMilestoneGrantsOneChestPerStreakRun() {
        saveChestsWithIds();
        when(milestoneRepository.findByDaysAndEnabledTrue(7))
                .thenReturn(Optional.of(StreakMilestone.builder().days(7).tier(ChestTier.BRONZE).build()));

        SessionRewards rewards = service.onSessionCompleted(userId, sessionId, true, 5, 50.0, 0, 7);

        assertThat(rewards.streakChest()).isNotNull();
        assertThat(rewards.streakChest().days()).isEqualTo(7);
        ArgumentCaptor<UserChest> captor = ArgumentCaptor.forClass(UserChest.class);
        verify(chestRepository).save(captor.capture());
        assertThat(captor.getValue().getSource()).isEqualTo(ChestSource.STREAK);
        assertThat(captor.getValue().getSourceKey()).isEqualTo("streak:7:2026-10-13");
    }

    @Test
    void streakChestIsNotGrantedTwiceForTheSameRun() {
        when(milestoneRepository.findByDaysAndEnabledTrue(7))
                .thenReturn(Optional.of(StreakMilestone.builder().days(7).tier(ChestTier.BRONZE).build()));
        when(chestRepository.existsByUserIdAndSourceKey(userId, "streak:7:2026-10-13")).thenReturn(true);

        SessionRewards rewards = service.onSessionCompleted(userId, sessionId, true, 5, 50.0, 0, 7);

        assertThat(rewards.streakChest()).isNull();
        verify(chestRepository, never()).save(any(UserChest.class));
    }

    @Test
    void boostIsAppliedToAPositiveSessionAndMarkedUsed() {
        UserBoost boost = UserBoost.builder().id(UUID.randomUUID()).userId(userId).type(BoostType.PLUS_5).build();
        when(boostRepository.findByUserIdAndUsedAtIsNullOrderByCreatedAtAsc(userId)).thenReturn(List.of(boost));

        SessionRewards rewards = service.onSessionCompleted(userId, sessionId, true, 5, 50.0, 40, 0);

        assertThat(rewards.boostApplied()).isNotNull();
        assertThat(rewards.boostApplied().bonusXp()).isEqualTo(5);
        assertThat(rewards.boostApplied().label()).isEqualTo("+5 XP");
        assertThat(boost.getUsedAt()).isEqualTo(NOW);
        assertThat(boost.getSessionId()).isEqualTo(sessionId);
        verify(boostRepository).save(boost);
    }

    @Test
    void percentBoostIsCappedAtTenXp() {
        UserBoost boost = UserBoost.builder().id(UUID.randomUUID()).userId(userId).type(BoostType.PCT_10).build();
        when(boostRepository.findByUserIdAndUsedAtIsNullOrderByCreatedAtAsc(userId)).thenReturn(List.of(boost));

        SessionRewards rewards = service.onSessionCompleted(userId, sessionId, true, 5, 50.0, 400, 0);

        assertThat(rewards.boostApplied().bonusXp()).isEqualTo(10);
    }

    @Test
    void boostIsNotConsumedByASessionThatLosesXp() {
        SessionRewards rewards = service.onSessionCompleted(userId, sessionId, true, 5, 50.0, -10, 0);

        assertThat(rewards.boostApplied()).isNull();
        verify(boostRepository, never()).save(any(UserBoost.class));
    }

    @Test
    void exhaustedCategoryTurnsIntoABoost() {
        UUID chestId = UUID.randomUUID();
        UserChest chest = UserChest.builder().id(chestId).userId(userId).tier(ChestTier.BRONZE)
                .source(ChestSource.SESSION_DAILY).sourceKey("k").earnedAt(NOW).build();
        when(chestRepository.findByIdAndUserId(chestId, userId)).thenReturn(Optional.of(chest));
        when(oddsRepository.findById(ChestTier.BRONZE))
                .thenReturn(Optional.of(RewardOdds.builder().tier(ChestTier.BRONZE).stickerPct(100).build()));
        RewardItem sticker = RewardItem.builder().id(UUID.randomUUID()).kind(RewardKind.STICKER).code("star")
                .name("Gold Star").build();
        when(itemRepository.findByKindAndEnabledTrue(RewardKind.STICKER)).thenReturn(List.of(sticker));
        when(userItemRepository.findByUserId(userId))
                .thenReturn(List.of(UserItem.builder().userId(userId).itemId(sticker.getId()).build()));
        service.setRandom(new Random(1));

        OpenChestResponse response = service.openChest(userId, chestId);

        assertThat(response.kind()).isEqualTo("BOOST");
        assertThat(response.duplicateConvertedToBoost()).isTrue();
        assertThat(chest.getOpenedAt()).isEqualTo(NOW);
        verify(boostRepository).save(any(UserBoost.class));
        verify(userItemRepository, never()).save(any(UserItem.class));
    }

    @Test
    void openingAChestGrantsAnUnownedSticker() {
        UUID chestId = UUID.randomUUID();
        UserChest chest = UserChest.builder().id(chestId).userId(userId).tier(ChestTier.BRONZE)
                .source(ChestSource.SESSION_DAILY).sourceKey("k").earnedAt(NOW).build();
        when(chestRepository.findByIdAndUserId(chestId, userId)).thenReturn(Optional.of(chest));
        when(oddsRepository.findById(ChestTier.BRONZE))
                .thenReturn(Optional.of(RewardOdds.builder().tier(ChestTier.BRONZE).stickerPct(100).build()));
        RewardItem sticker = RewardItem.builder().id(UUID.randomUUID()).kind(RewardKind.STICKER).code("star")
                .name("Gold Star").build();
        when(itemRepository.findByKindAndEnabledTrue(RewardKind.STICKER)).thenReturn(List.of(sticker));
        when(userItemRepository.findByUserId(userId)).thenReturn(List.of());

        OpenChestResponse response = service.openChest(userId, chestId);

        assertThat(response.kind()).isEqualTo("STICKER");
        assertThat(response.code()).isEqualTo("star");
        assertThat(response.duplicateConvertedToBoost()).isFalse();
        verify(userItemRepository).save(any(UserItem.class));
    }

    @Test
    void anOpenedChestCannotBeOpenedAgain() {
        UUID chestId = UUID.randomUUID();
        UserChest chest = UserChest.builder().id(chestId).userId(userId).tier(ChestTier.GOLD)
                .source(ChestSource.STREAK).sourceKey("k").earnedAt(NOW).openedAt(NOW).build();
        when(chestRepository.findByIdAndUserId(chestId, userId)).thenReturn(Optional.of(chest));

        assertThatThrownBy(() -> service.openChest(userId, chestId)).isInstanceOf(ConflictException.class);
        verify(oddsRepository, never()).findById(any());
    }
}
