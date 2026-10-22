package com.checkpoint.reward.service;

import com.checkpoint.reward.entity.ChestSource;
import com.checkpoint.reward.entity.ChestTier;
import com.checkpoint.reward.entity.UserChest;
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
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class RewardServiceFocusChestTest {

    private static final Instant NOW = Instant.parse("2026-10-22T10:00:00Z");
    private static final LocalDate DAY = LocalDate.of(2026, 10, 22);

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
    private RewardService service;

    @BeforeEach
    void setUp() {
        service = new RewardService(itemRepository, oddsRepository, milestoneRepository, chestRepository,
                userItemRepository, boostRepository, loadoutRepository, Clock.fixed(NOW, ZoneOffset.UTC));
        when(chestRepository.save(any(UserChest.class))).thenAnswer(inv -> {
            UserChest chest = inv.getArgument(0);
            chest.setId(UUID.randomUUID());
            return chest;
        });
    }

    @Test
    void grantsOneFocusChestKeyedByTheDay() {
        when(chestRepository.existsByUserIdAndSourceKey(userId, "focus:2026-10-22")).thenReturn(false);

        UserChest chest = service.grantFocusChest(userId, DAY, ChestTier.SILVER);

        ArgumentCaptor<UserChest> captor = ArgumentCaptor.forClass(UserChest.class);
        verify(chestRepository).save(captor.capture());
        assertThat(chest).isNotNull();
        assertThat(captor.getValue().getSource()).isEqualTo(ChestSource.FOCUS);
        assertThat(captor.getValue().getTier()).isEqualTo(ChestTier.SILVER);
        assertThat(captor.getValue().getSourceKey()).isEqualTo("focus:2026-10-22");
    }

    @Test
    void aSecondGrantForTheSameDayIsIgnored() {
        when(chestRepository.existsByUserIdAndSourceKey(userId, "focus:2026-10-22")).thenReturn(true);

        UserChest chest = service.grantFocusChest(userId, DAY, ChestTier.GOLD);

        assertThat(chest).isNull();
        verify(chestRepository, never()).save(any());
    }
}
