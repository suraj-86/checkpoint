package com.checkpoint.xp.algorithm;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LevelCalculatorTest {

    private final LevelCalculator calculator = new LevelCalculator();

    @Nested
    @DisplayName("levelForXp - threshold boundaries")
    class LevelForXp {

        @ParameterizedTest(name = "{0} XP -> Level {1}")
        @CsvSource({
                "0, 0",
                "999, 0",       // just below Level 1
                "1000, 1",      // exactly at Level 1's threshold
                "1001, 1",
                "2499, 1",      // just below Level 2
                "2500, 2",
                "189999, 19",   // just below Level 20
                "190000, 20",   // exactly at Level 20
        })
        void thresholdBoundaries(int xp, int expectedLevel) {
            assertThat(calculator.levelForXp(xp)).isEqualTo(expectedLevel);
        }

        @Test
        @DisplayName("XP far beyond Level 20's threshold still caps at Level 20 (XP itself is never capped)")
        void neverExceedsMaxLevel() {
            assertThat(calculator.levelForXp(1_000_000)).isEqualTo(LevelCalculator.MAX_LEVEL);
        }

        @Test
        @DisplayName("negative XP (should not normally occur) is treated defensively as Level 0")
        void negativeXpTreatedAsLevelZero() {
            assertThat(calculator.levelForXp(-500)).isEqualTo(0);
        }
    }

    @Nested
    @DisplayName("gainLossForLevel")
    class GainLoss {

        @Test
        void level1HasTheFastestProgression() {
            int[] range = calculator.gainLossForLevel(1);
            assertThat(range[0]).isEqualTo(100);
            assertThat(range[1]).isEqualTo(-10);
        }

        @Test
        void level20HasTheSlowestProgression() {
            int[] range = calculator.gainLossForLevel(20);
            assertThat(range[0]).isEqualTo(25);
            assertThat(range[1]).isEqualTo(-40);
        }

        @Test
        @DisplayName("Level 0 is treated the same as Level 1 (no explicit row in the docs for Level 0)")
        void levelZeroFallsBackToLevelOne() {
            assertThat(calculator.gainLossForLevel(0)).isEqualTo(calculator.gainLossForLevel(1));
        }

        @Test
        void maxGainGenerallyDecreasesAsLevelIncreases() {
            int gainAtLevel1 = calculator.gainLossForLevel(1)[0];
            int gainAtLevel10 = calculator.gainLossForLevel(10)[0];
            int gainAtLevel20 = calculator.gainLossForLevel(20)[0];
            assertThat(gainAtLevel1).isGreaterThan(gainAtLevel10);
            assertThat(gainAtLevel10).isGreaterThan(gainAtLevel20);
        }

        @Test
        void requestingAnUndefinedLevelThrows() {
            assertThatThrownBy(() -> calculator.gainLossForLevel(21))
                    .isInstanceOf(IllegalArgumentException.class);
        }
    }
}
