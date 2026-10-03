package com.checkpoint.xp.algorithm;

import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.Map;

@Component
public class StreakCalculator {

    private static final Map<Integer, Integer> MILESTONE_BONUSES = Map.of(
            3, 25,
            7, 50,
            14, 100,
            30, 200,
            60, 350,
            100, 500
    );

    public record Result(int newCurrentStreak, int newLongestStreak, int milestoneBonus) {
    }

    public Result onQualifyingDailySession(
            int previousCurrentStreak,
            int previousLongestStreak,
            LocalDate lastDailySessionDate,
            LocalDate today
    ) {
        int newStreak;
        boolean isNewDay;

        if (lastDailySessionDate == null) {
            newStreak = 1;
            isNewDay = true;
        } else if (lastDailySessionDate.equals(today)) {
            newStreak = previousCurrentStreak;
            isNewDay = false;
        } else if (lastDailySessionDate.equals(today.minusDays(1))) {
            newStreak = previousCurrentStreak + 1;
            isNewDay = true;
        } else {
            newStreak = 1;
            isNewDay = true;
        }

        int newLongest = Math.max(previousLongestStreak, newStreak);

        int bonus = isNewDay ? MILESTONE_BONUSES.getOrDefault(newStreak, 0) : 0;

        return new Result(newStreak, newLongest, bonus);
    }
}
