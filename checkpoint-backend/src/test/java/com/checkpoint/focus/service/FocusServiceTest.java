package com.checkpoint.focus.service;

import com.checkpoint.focus.dto.FocusResponse;
import com.checkpoint.focus.entity.FocusDay;
import com.checkpoint.focus.entity.FocusState;
import com.checkpoint.focus.repository.FocusDayRepository;
import com.checkpoint.focus.repository.FocusStateRepository;
import com.checkpoint.reward.entity.ChestSource;
import com.checkpoint.reward.entity.ChestTier;
import com.checkpoint.reward.entity.UserChest;
import com.checkpoint.reward.service.RewardService;
import com.checkpoint.settings.service.SettingsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class FocusServiceTest {

    private static final Instant START = Instant.parse("2026-10-22T10:00:00Z");
    private static final LocalDate TODAY = LocalDate.of(2026, 10, 22);

    /** A clock the tests can move forward. */
    private static final class MovableClock extends Clock {
        private Instant now = START;

        void advance(long seconds) {
            now = now.plusSeconds(seconds);
        }

        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return now;
        }
    }

    @Mock
    private FocusDayRepository dayRepository;
    @Mock
    private FocusStateRepository stateRepository;
    @Mock
    private SettingsService settingsService;
    @Mock
    private RewardService rewardService;

    private final UUID userId = UUID.randomUUID();
    private final Map<LocalDate, FocusDay> days = new HashMap<>();
    private final Map<UUID, FocusState> states = new HashMap<>();
    private final MovableClock clock = new MovableClock();
    private int target = 120;
    private FocusService service;

    @BeforeEach
    void setUp() {
        service = new FocusService(dayRepository, stateRepository, settingsService, rewardService, clock);

        when(settingsService.dailyFocusMinutes(userId)).thenAnswer(inv -> target);
        when(dayRepository.findByUserIdAndDay(eq(userId), any(LocalDate.class)))
                .thenAnswer(inv -> Optional.ofNullable(days.get(inv.<LocalDate>getArgument(1))));
        when(dayRepository.findByUserIdAndDayGreaterThanEqualOrderByDayDesc(eq(userId), any(LocalDate.class)))
                .thenAnswer(inv -> {
                    LocalDate from = inv.getArgument(1);
                    List<FocusDay> list = new ArrayList<>();
                    days.values().stream()
                            .filter(d -> !d.getDay().isBefore(from))
                            .sorted((a, b) -> b.getDay().compareTo(a.getDay()))
                            .forEach(list::add);
                    return list;
                });
        when(dayRepository.save(any(FocusDay.class))).thenAnswer(inv -> {
            FocusDay d = inv.getArgument(0);
            days.put(d.getDay(), d);
            return d;
        });
        when(stateRepository.findById(userId)).thenAnswer(inv -> Optional.ofNullable(states.get(userId)));
        when(stateRepository.save(any(FocusState.class))).thenAnswer(inv -> {
            FocusState s = inv.getArgument(0);
            states.put(s.getUserId(), s);
            return s;
        });
        when(rewardService.grantFocusChest(eq(userId), any(LocalDate.class), any(ChestTier.class)))
                .thenAnswer(inv -> UserChest.builder()
                        .id(UUID.randomUUID())
                        .userId(userId)
                        .tier(inv.getArgument(2))
                        .source(ChestSource.FOCUS)
                        .build());
    }

    private void seedDay(LocalDate date, int seconds, int targetMinutes, boolean rewarded) {
        days.put(date, FocusDay.builder().userId(userId).day(date).seconds(seconds)
                .targetMinutes(targetMinutes).rewarded(rewarded).build());
    }

    @Test
    void firstTickOnlyStartsTheClockAndCreditsNothing() {
        FocusResponse response = service.tick(userId);

        assertThat(response.todaySeconds()).isZero();
        assertThat(states).containsKey(userId);
    }

    @Test
    void tickWithinTheGapCreditsTheRealTime() {
        service.tick(userId);
        clock.advance(30);
        FocusResponse response = service.tick(userId);

        assertThat(response.todaySeconds()).isEqualTo(30);
    }

    @Test
    void tickAfterALongGapCreditsNothing() {
        service.tick(userId);
        clock.advance(200);
        FocusResponse response = service.tick(userId);

        assertThat(response.todaySeconds()).isZero();
    }

    @Test
    void creditStopsAtTheDailyCap() {
        seedDay(TODAY, 16 * 3600 - 10, 720, true);
        states.put(userId, FocusState.builder().userId(userId).lastTickAt(START.minusSeconds(60)).build());

        FocusResponse response = service.tick(userId);

        assertThat(response.todaySeconds()).isEqualTo(16 * 3600);
    }

    @Test
    void reachingTheTargetGrantsOneChestOnly() {
        target = 120;
        seedDay(TODAY, 7195, 120, false);
        states.put(userId, FocusState.builder().userId(userId).lastTickAt(START.minusSeconds(10)).build());

        FocusResponse first = service.tick(userId);
        clock.advance(30);
        FocusResponse second = service.tick(userId);

        assertThat(first.rewardChest()).isNotNull();
        assertThat(first.rewardChest().tier()).isEqualTo("SILVER");
        assertThat(first.rewarded()).isTrue();
        assertThat(first.targetReached()).isTrue();
        assertThat(second.rewardChest()).isNull();
        verify(rewardService, times(1)).grantFocusChest(eq(userId), eq(TODAY), eq(ChestTier.SILVER));
    }

    @Test
    void aTargetBelowThirtyMinutesNeverEarnsAChest() {
        target = 15;
        seedDay(TODAY, 890, 15, false);
        states.put(userId, FocusState.builder().userId(userId).lastTickAt(START.minusSeconds(20)).build());

        FocusResponse response = service.tick(userId);

        assertThat(response.targetReached()).isTrue();
        assertThat(response.rewardChest()).isNull();
        verify(rewardService, never()).grantFocusChest(any(), any(), any());
    }

    @Test
    void stopClearsTheRunningState() {
        service.tick(userId);

        service.stop(userId);

        verify(stateRepository).deleteById(userId);
    }

    @Test
    void chestTierFollowsTheTarget() {
        assertThat(FocusService.tierForTarget(30)).isEqualTo(ChestTier.BRONZE);
        assertThat(FocusService.tierForTarget(119)).isEqualTo(ChestTier.BRONZE);
        assertThat(FocusService.tierForTarget(120)).isEqualTo(ChestTier.SILVER);
        assertThat(FocusService.tierForTarget(299)).isEqualTo(ChestTier.SILVER);
        assertThat(FocusService.tierForTarget(300)).isEqualTo(ChestTier.GOLD);
    }

    @Test
    void streakCountsDaysWithTheTargetMetEndingYesterdayWhenTodayIsNotDoneYet() {
        seedDay(TODAY.minusDays(1), 7200, 120, true);
        seedDay(TODAY.minusDays(2), 7300, 120, true);
        seedDay(TODAY.minusDays(4), 7300, 120, true);
        seedDay(TODAY, 600, 120, false);

        FocusResponse response = service.get(userId);

        assertThat(response.streakDays()).isEqualTo(2);
        assertThat(response.last7Days()).hasSize(7);
        assertThat(response.last7Days().get(6).day()).isEqualTo(TODAY.toString());
        assertThat(response.last7Days().get(6).seconds()).isEqualTo(600);
        assertThat(response.last7Days().get(5).targetMet()).isTrue();
        assertThat(response.last7Days().get(4).targetMet()).isTrue();
        assertThat(response.last7Days().get(3).targetMet()).isFalse();
        assertThat(response.last7Days().get(2).targetMet()).isTrue();
    }
}
