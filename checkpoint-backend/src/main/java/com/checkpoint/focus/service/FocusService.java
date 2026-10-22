package com.checkpoint.focus.service;

import com.checkpoint.focus.dto.FocusResponse;
import com.checkpoint.focus.dto.FocusResponse.DayDto;
import com.checkpoint.focus.dto.FocusResponse.RewardChestDto;
import com.checkpoint.focus.entity.FocusDay;
import com.checkpoint.focus.entity.FocusState;
import com.checkpoint.focus.repository.FocusDayRepository;
import com.checkpoint.focus.repository.FocusStateRepository;
import com.checkpoint.reward.entity.ChestTier;
import com.checkpoint.reward.entity.UserChest;
import com.checkpoint.reward.service.RewardService;
import com.checkpoint.settings.service.SettingsService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Focus time. The browser sends a heartbeat every so often while the timer runs and the tab is visible;
 * the server credits only the real time between heartbeats, so a forgotten timer earns nothing.
 */
@Service
public class FocusService {

    /** Largest gap between two heartbeats that still counts as continuous focus. */
    static final long MAX_GAP_SECONDS = 90;
    static final int MAX_DAY_SECONDS = 16 * 3600;
    static final int MIN_REWARD_TARGET_MINUTES = 30;
    private static final int STREAK_LOOKBACK_DAYS = 365;

    private final FocusDayRepository dayRepository;
    private final FocusStateRepository stateRepository;
    private final SettingsService settingsService;
    private final RewardService rewardService;
    private final Clock clock;

    public FocusService(
            FocusDayRepository dayRepository,
            FocusStateRepository stateRepository,
            SettingsService settingsService,
            RewardService rewardService,
            Clock clock
    ) {
        this.dayRepository = dayRepository;
        this.stateRepository = stateRepository;
        this.settingsService = settingsService;
        this.rewardService = rewardService;
        this.clock = clock;
    }

    /** Chest tier for a day's target: under 2 hours bronze, 2 to under 5 hours silver, 5 or more gold. */
    static ChestTier tierForTarget(int targetMinutes) {
        if (targetMinutes >= 300) {
            return ChestTier.GOLD;
        }
        if (targetMinutes >= 120) {
            return ChestTier.SILVER;
        }
        return ChestTier.BRONZE;
    }

    @Transactional(readOnly = true)
    public FocusResponse get(UUID userId) {
        return build(userId, today(), null);
    }

    @Transactional
    public FocusResponse tick(UUID userId) {
        Instant now = Instant.now(clock);
        LocalDate today = today();
        int target = settingsService.dailyFocusMinutes(userId);

        long credit = 0;
        FocusState state = stateRepository.findById(userId).orElse(null);
        if (state != null) {
            long gap = Duration.between(state.getLastTickAt(), now).getSeconds();
            if (gap > 0 && gap <= MAX_GAP_SECONDS) {
                credit = Math.min(gap, MAX_GAP_SECONDS);
            }
        }

        FocusDay day = dayRepository.findByUserIdAndDay(userId, today).orElse(null);
        if (day == null && credit > 0) {
            day = FocusDay.builder().userId(userId).day(today).seconds(0).targetMinutes(target).rewarded(false).build();
        }

        RewardChestDto granted = null;
        if (day != null) {
            if (credit > 0) {
                day.setSeconds((int) Math.min(MAX_DAY_SECONDS, day.getSeconds() + credit));
            }
            if (!day.isRewarded()) {
                day.setTargetMinutes(target);
                if (target >= MIN_REWARD_TARGET_MINUTES && day.getSeconds() >= target * 60) {
                    UserChest chest = rewardService.grantFocusChest(userId, today, tierForTarget(target));
                    day.setRewarded(true);
                    if (chest != null) {
                        granted = new RewardChestDto(chest.getId(), chest.getTier().name());
                    }
                }
            }
            dayRepository.save(day);
        }

        if (state == null) {
            state = FocusState.builder().userId(userId).build();
        }
        state.setLastTickAt(now);
        stateRepository.save(state);

        return build(userId, today, granted);
    }

    @Transactional
    public FocusResponse stop(UUID userId) {
        stateRepository.deleteById(userId);
        return build(userId, today(), null);
    }

    private LocalDate today() {
        return LocalDate.now(clock.withZone(ZoneOffset.UTC));
    }

    private FocusResponse build(UUID userId, LocalDate today, RewardChestDto granted) {
        List<FocusDay> rows = dayRepository.findByUserIdAndDayGreaterThanEqualOrderByDayDesc(
                userId, today.minusDays(STREAK_LOOKBACK_DAYS));
        Map<LocalDate, FocusDay> byDay = new HashMap<>();
        for (FocusDay row : rows) {
            byDay.put(row.getDay(), row);
        }

        FocusDay todayRow = byDay.get(today);
        int settingsTarget = settingsService.dailyFocusMinutes(userId);
        int targetMinutes = todayRow != null && todayRow.isRewarded() ? todayRow.getTargetMinutes() : settingsTarget;
        int todaySeconds = todayRow == null ? 0 : todayRow.getSeconds();

        List<DayDto> last7 = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            FocusDay row = byDay.get(date);
            last7.add(new DayDto(date.toString(), row == null ? 0 : row.getSeconds(), row != null && met(row)));
        }

        return new FocusResponse(
                todaySeconds,
                targetMinutes,
                todaySeconds >= targetMinutes * 60,
                todayRow != null && todayRow.isRewarded(),
                granted,
                last7,
                streak(byDay, today)
        );
    }

    private static boolean met(FocusDay row) {
        return row.getSeconds() >= row.getTargetMinutes() * 60;
    }

    /** Consecutive days with the target met, counted back from today, or from yesterday if today is not met yet. */
    private static int streak(Map<LocalDate, FocusDay> byDay, LocalDate today) {
        LocalDate cursor = today;
        FocusDay row = byDay.get(cursor);
        if (row == null || !met(row)) {
            cursor = today.minusDays(1);
        }
        int count = 0;
        while (true) {
            FocusDay r = byDay.get(cursor);
            if (r == null || !met(r)) {
                break;
            }
            count++;
            cursor = cursor.minusDays(1);
        }
        return count;
    }
}
