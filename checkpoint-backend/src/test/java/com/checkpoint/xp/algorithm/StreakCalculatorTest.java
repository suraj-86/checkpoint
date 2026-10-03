package com.checkpoint.xp.algorithm;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class StreakCalculatorTest {

    private final StreakCalculator calculator = new StreakCalculator();
    private final LocalDate today = LocalDate.of(2026, 10, 1);

    @Nested
    @DisplayName("Streak continuation")
    class Continuation {

        @Test
        @DisplayName("first-ever qualifying Daily Session starts the streak at 1")
        void firstEverSession() {
            var result = calculator.onQualifyingDailySession(0, 0, null, today);
            assertThat(result.newCurrentStreak()).isEqualTo(1);
            assertThat(result.newLongestStreak()).isEqualTo(1);
        }

        @Test
        @DisplayName("completing on the consecutive next day extends the streak by one")
        void consecutiveDayExtends() {
            var result = calculator.onQualifyingDailySession(5, 5, today.minusDays(1), today);
            assertThat(result.newCurrentStreak()).isEqualTo(6);
        }

        @Test
        @DisplayName("a second Daily Session completed the SAME day does not increment again")
        void sameDayDoesNotDoubleIncrement() {
            var result = calculator.onQualifyingDailySession(5, 5, today, today);
            assertThat(result.newCurrentStreak()).isEqualTo(5);
        }

        @ParameterizedTest(name = "a gap of {0} days breaks the streak back to 1")
        @ValueSource(ints = {2, 3, 10, 365})
        void anyGapOfTwoOrMoreDaysBreaksTheStreak(int gapDays) {
            var result = calculator.onQualifyingDailySession(20, 20, today.minusDays(gapDays), today);
            assertThat(result.newCurrentStreak()).isEqualTo(1);
        }

        @Test
        @DisplayName("longest streak only updates when the new streak actually exceeds it")
        void longestStreakOnlyGrowsWhenExceeded() {
            var result = calculator.onQualifyingDailySession(0, 50, today.minusDays(5), today);
            assertThat(result.newCurrentStreak()).isEqualTo(1);
            assertThat(result.newLongestStreak()).isEqualTo(50);
        }

        @Test
        @DisplayName("exceeding the previous longest streak updates it")
        void newRecordUpdatesLongest() {
            var result = calculator.onQualifyingDailySession(49, 49, today.minusDays(1), today);
            assertThat(result.newCurrentStreak()).isEqualTo(50);
            assertThat(result.newLongestStreak()).isEqualTo(50);
        }
    }

    @Nested
    @DisplayName("Section 14: milestone bonuses")
    class Milestones {

        @ParameterizedTest(name = "reaching a {0}-day streak awards +{1} XP")
        @org.junit.jupiter.params.provider.CsvSource({
                "3, 25",
                "7, 50",
                "14, 100",
                "30, 200",
                "60, 350",
                "100, 500",
        })
        void exactMilestonesAwardTheDocumentedBonus(int streakLength, int expectedBonus) {
            var result = calculator.onQualifyingDailySession(streakLength - 1, streakLength - 1,
                    today.minusDays(1), today);
            assertThat(result.newCurrentStreak()).isEqualTo(streakLength);
            assertThat(result.milestoneBonus()).isEqualTo(expectedBonus);
        }

        @ParameterizedTest(name = "a {0}-day streak (not a milestone) awards no bonus")
        @ValueSource(ints = {1, 2, 4, 6, 8, 13, 15, 29, 31, 59, 61, 99, 101})
        void nonMilestoneStreaksAwardNoBonus(int streakLength) {
            var result = calculator.onQualifyingDailySession(streakLength - 1, streakLength - 1,
                    today.minusDays(1), today);
            assertThat(result.milestoneBonus()).isEqualTo(0);
        }

        @Test
        @DisplayName("reaching 14 days awards exactly +100, not the sum of all passed milestones (25+50+100)")
        void onlyTheNewlyReachedMilestonePays() {
            var result = calculator.onQualifyingDailySession(13, 13, today.minusDays(1), today);
            assertThat(result.newCurrentStreak()).isEqualTo(14);
            assertThat(result.milestoneBonus()).isEqualTo(100);
        }

        @Test
        @DisplayName("a same-day repeat completion never re-awards a milestone bonus")
        void sameDayRepeatNeverReAwardsMilestone() {
            var result = calculator.onQualifyingDailySession(7, 7, today, today);
            assertThat(result.newCurrentStreak()).isEqualTo(7);
            assertThat(result.milestoneBonus()).isEqualTo(0);
        }
    }
}
