package com.checkpoint.review.algorithm;

import com.checkpoint.review.entity.ReviewState;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ReviewTransitionCalculatorTest {

    private final ReviewTransitionCalculator calculator = new ReviewTransitionCalculator();

    @Nested
    @DisplayName("Section 4: First encounter")
    class FirstEncounter {

        @Test
        @DisplayName("correct answer on a brand-new question -> Stage 1, STABLE, review tomorrow")
        void newQuestionCorrect() {
            var result = calculator.transition(ReviewTransitionCalculator.Input.firstEncounter(true));

            assertThat(result.newState()).isEqualTo(ReviewState.STABLE);
            assertThat(result.newStage()).isEqualTo(1);
            assertThat(result.intervalDays()).isEqualTo(1);
            assertThat(result.scheduleChanged()).isTrue();
        }

        @Test
        @DisplayName("incorrect answer on a brand-new question -> Stage 1, NEEDS_REVIEW")
        void newQuestionIncorrect() {
            var result = calculator.transition(ReviewTransitionCalculator.Input.firstEncounter(false));

            assertThat(result.newState()).isEqualTo(ReviewState.NEEDS_REVIEW);
            assertThat(result.newStage()).isEqualTo(1);
            assertThat(result.scheduleChanged()).isTrue();
        }
    }

    @Nested
    @DisplayName("Section 5: Repeated success walks stage 1 -> 5")
    class RepeatedSuccess {

        @Test
        @DisplayName("correct answers on different days climb every stage in order")
        void climbsAllFiveStages() {
            int stage = 1;
            int[] expectedIntervals = {3, 7, 14, 30};

            for (int expectedInterval : expectedIntervals) {
                var result = calculator.transition(
                        ReviewTransitionCalculator.Input.existing(stage, true, false));
                stage = result.newStage();
                assertThat(result.newState()).isEqualTo(ReviewState.STABLE);
                assertThat(result.intervalDays()).isEqualTo(expectedInterval);
            }
            assertThat(stage).isEqualTo(5);
        }

        @Test
        @DisplayName("correct answer at Stage 5 stays at Stage 5 (does not overflow)")
        void staysAtMaxStage() {
            var result = calculator.transition(
                    ReviewTransitionCalculator.Input.existing(5, true, false));

            assertThat(result.newStage()).isEqualTo(5);
            assertThat(result.intervalDays()).isEqualTo(30);
        }
    }

    @Nested
    @DisplayName("Section 6/7: Wrong answers step back, never reset to zero")
    class WrongAnswers {

        @Test
        @DisplayName("Stage 4 STABLE + wrong -> Stage 3 NEEDS_REVIEW, ~7 day interval")
        void stepsBackOneStageExactlyAsDocumented() {
            var result = calculator.transition(
                    ReviewTransitionCalculator.Input.existing(4, false, false));

            assertThat(result.newState()).isEqualTo(ReviewState.NEEDS_REVIEW);
            assertThat(result.newStage()).isEqualTo(3);
            assertThat(result.intervalDays()).isEqualTo(7);
        }

        @Test
        @DisplayName("repeated wrong answers walk 4 -> 3 -> 2 -> 1, never below 1")
        void repeatedWrongNeverGoesBelowStageOne() {
            int stage = 4;
            for (int i = 0; i < 3; i++) {
                var result = calculator.transition(
                        ReviewTransitionCalculator.Input.existing(stage, false, false));
                stage = result.newStage();
            }
            assertThat(stage).isEqualTo(1);

            var result = calculator.transition(
                    ReviewTransitionCalculator.Input.existing(1, false, false));
            assertThat(result.newStage()).isEqualTo(1);
        }

        @Test
        @DisplayName("wrong answer is never capped by same-day history (unlike correct answers)")
        void wrongAnswersIgnoreSameDayFlag() {
            var result = calculator.transition(
                    ReviewTransitionCalculator.Input.existing(4, false, true));

            assertThat(result.newState()).isEqualTo(ReviewState.NEEDS_REVIEW);
            assertThat(result.newStage()).isEqualTo(3);
            assertThat(result.scheduleChanged()).isTrue();
        }
    }

    @Nested
    @DisplayName("Section 8: Correct answer after failure")
    class RecoveryAfterFailure {

        @Test
        @DisplayName("Stage 3 + correct -> Stage 4, back to STABLE")
        void recoversUpwardAfterFailure() {
            var result = calculator.transition(
                    ReviewTransitionCalculator.Input.existing(3, true, false));

            assertThat(result.newState()).isEqualTo(ReviewState.STABLE);
            assertThat(result.newStage()).isEqualTo(4);
            assertThat(result.intervalDays()).isEqualTo(14);
        }
    }

    @Nested
    @DisplayName("Section 13: Fast Practice same-day advance cap")
    class SameDayCap {

        @Test
        @DisplayName("second correct answer same day does not advance the stage further")
        void secondCorrectSameDayDoesNotAdvance() {
            var result = calculator.transition(
                    ReviewTransitionCalculator.Input.existing(2, true, true));

            assertThat(result.newState()).isEqualTo(ReviewState.STABLE);
            assertThat(result.newStage()).isEqualTo(2);
            assertThat(result.scheduleChanged()).isFalse();
        }

        @Test
        @DisplayName("first correct answer of the day (sameDay=false) DOES advance normally")
        void firstCorrectOfDayStillAdvances() {
            var result = calculator.transition(
                    ReviewTransitionCalculator.Input.existing(2, true, false));

            assertThat(result.newStage()).isEqualTo(3);
            assertThat(result.scheduleChanged()).isTrue();
        }
    }

    @Nested
    @DisplayName("intervalFor() bounds checking")
    class IntervalLookup {

        @Test
        void allFiveStagesHaveTheDocumentedIntervals() {
            assertThat(ReviewTransitionCalculator.intervalFor(1)).isEqualTo(1);
            assertThat(ReviewTransitionCalculator.intervalFor(2)).isEqualTo(3);
            assertThat(ReviewTransitionCalculator.intervalFor(3)).isEqualTo(7);
            assertThat(ReviewTransitionCalculator.intervalFor(4)).isEqualTo(14);
            assertThat(ReviewTransitionCalculator.intervalFor(5)).isEqualTo(30);
        }

        @Test
        void rejectsAnOutOfRangeStage() {
            org.junit.jupiter.api.Assertions.assertThrows(
                    IllegalArgumentException.class,
                    () -> ReviewTransitionCalculator.intervalFor(6));
        }
    }
}
