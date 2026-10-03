package com.checkpoint.xp.algorithm;

import com.checkpoint.practice.entity.SessionType;
import com.checkpoint.question.entity.Difficulty;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

class XpCalculatorTest {

    private final XpCalculator calculator = new XpCalculator(new LevelCalculator());

    private List<XpCalculator.AnsweredQuestion> uniform(Difficulty difficulty, int total, int correctCount) {
        List<XpCalculator.AnsweredQuestion> list = new ArrayList<>();
        for (int i = 0; i < total; i++) {
            list.add(new XpCalculator.AnsweredQuestion(difficulty, i < correctCount));
        }
        return list;
    }

    @Nested
    @DisplayName("Section 3: difficulty weights")
    class Weights {
        @Test
        void exactWeightsPerDifficulty() {
            assertThat(XpCalculator.weightFor(Difficulty.EASY)).isEqualTo(0.80);
            assertThat(XpCalculator.weightFor(Difficulty.MEDIUM)).isEqualTo(1.00);
            assertThat(XpCalculator.weightFor(Difficulty.HARD)).isEqualTo(1.25);
            assertThat(XpCalculator.weightFor(Difficulty.EXPERT)).isEqualTo(1.50);
        }
    }

    @Nested
    @DisplayName("Section 5: performance band boundaries")
    class BandBoundaries {

        @Test
        void justBelowNinetyIsGoodNotExcellent() {
            var answered = uniform(Difficulty.MEDIUM, 1000, 899);
            var result = calculator.calculate(answered, 10_000, SessionType.DAILY);
            assertThat(result.band()).isEqualTo(XpCalculator.PerformanceBand.GOOD);
        }

        @Test
        void exactlyNinetyIsExcellent() {
            var answered = uniform(Difficulty.MEDIUM, 100, 90);
            var result = calculator.calculate(answered, 10_000, SessionType.DAILY);
            assertThat(result.band()).isEqualTo(XpCalculator.PerformanceBand.EXCELLENT);
        }

        @Test
        void exactlySeventyFiveIsGood() {
            var answered = uniform(Difficulty.MEDIUM, 100, 75);
            var result = calculator.calculate(answered, 10_000, SessionType.DAILY);
            assertThat(result.band()).isEqualTo(XpCalculator.PerformanceBand.GOOD);
        }

        @Test
        void exactlySixtyIsFair() {
            var answered = uniform(Difficulty.MEDIUM, 100, 60);
            var result = calculator.calculate(answered, 10_000, SessionType.DAILY);
            assertThat(result.band()).isEqualTo(XpCalculator.PerformanceBand.FAIR);
        }

        @Test
        void exactlyFortyIsWeakNotPoor() {
            var answered = uniform(Difficulty.MEDIUM, 100, 40);
            var result = calculator.calculate(answered, 10_000, SessionType.DAILY);
            assertThat(result.band()).isEqualTo(XpCalculator.PerformanceBand.WEAK);
        }

        @Test
        void justBelowFortyIsPoor() {
            var answered = uniform(Difficulty.MEDIUM, 100, 39);
            var result = calculator.calculate(answered, 10_000, SessionType.DAILY);
            assertThat(result.band()).isEqualTo(XpCalculator.PerformanceBand.POOR);
        }

        @Test
        void zeroPercentIsPoor() {
            var answered = uniform(Difficulty.MEDIUM, 10, 0);
            var result = calculator.calculate(answered, 10_000, SessionType.DAILY);
            assertThat(result.band()).isEqualTo(XpCalculator.PerformanceBand.POOR);
        }
    }

    @Nested
    @DisplayName("docs' own worked examples")
    class WorkedExamples {

        @Test
        @DisplayName("Level 5, Poor (30%) -> exactly -20 XP")
        void level5Poor30PercentIsMinusTwenty() {
            var answered = uniform(Difficulty.MEDIUM, 10, 3);
            var result = calculator.calculate(answered, 10_000, SessionType.DAILY);

            assertThat(result.currentLevel()).isEqualTo(5);
            assertThat(result.band()).isEqualTo(XpCalculator.PerformanceBand.POOR);
            assertThat(result.xpChange()).isEqualTo(-20);
        }

        @Test
        @DisplayName("Fast Practice: a Daily-equivalent +60 becomes +15 (25%, Level 6 Excellent)")
        void fastPracticeReducesToTwentyFivePercent() {
            var dailyAnswered = uniform(Difficulty.MEDIUM, 10, 10);
            var dailyResult = calculator.calculate(dailyAnswered, 14_000, SessionType.DAILY);
            assertThat(dailyResult.xpChange()).isEqualTo(60);

            var fastResult = calculator.calculate(dailyAnswered, 14_000, SessionType.FAST);
            assertThat(fastResult.xpChange()).isEqualTo(15);
        }
    }

    @Nested
    @DisplayName("Rounding behaviour")
    class Rounding {

        @Test
        @DisplayName("a .5 fractional result rounds up (round-half-up), not banker's rounding")
        void halfRoundsUp() {
            var answered = uniform(Difficulty.MEDIUM, 100, 80);
            var result = calculator.calculate(answered, 19_000, SessionType.DAILY);
            assertThat(result.currentLevel()).isEqualTo(7);
            assertThat(result.xpChange()).isEqualTo(39);
        }
    }

    @Nested
    @DisplayName("Mixed difficulty weighting")
    class MixedDifficulty {

        @Test
        @DisplayName("harder questions contribute more weight to both available and earned totals")
        void harderQuestionsWeighMore() {
            List<XpCalculator.AnsweredQuestion> answered = List.of(
                    new XpCalculator.AnsweredQuestion(Difficulty.EASY, true),
                    new XpCalculator.AnsweredQuestion(Difficulty.EXPERT, false)
            );
            var result = calculator.calculate(answered, 0, SessionType.DAILY);
            assertThat(result.performancePercent()).isCloseTo(34.78, within(0.1));
            assertThat(result.band()).isEqualTo(XpCalculator.PerformanceBand.POOR);
        }
    }

    @Nested
    @DisplayName("Edge cases")
    class EdgeCases {

        @Test
        @DisplayName("an empty answered list does not throw (defensive — Phase 5 should never actually produce this)")
        void emptyAnsweredListIsHandledSafely() {
            var result = calculator.calculate(List.of(), 10_000, SessionType.DAILY);
            assertThat(result.performancePercent()).isEqualTo(0.0);
            assertThat(result.band()).isEqualTo(XpCalculator.PerformanceBand.POOR);
        }

        @Test
        @DisplayName("a brand-new student (0 XP) is evaluated at Level 0's gain/loss range (same as Level 1)")
        void brandNewStudentUsesLevelZeroRange() {
            var answered = uniform(Difficulty.MEDIUM, 10, 10);
            var result = calculator.calculate(answered, 0, SessionType.DAILY);
            assertThat(result.currentLevel()).isEqualTo(0);
            assertThat(result.xpChange()).isEqualTo(100);
        }
    }
}
