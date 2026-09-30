package com.checkpoint.review.algorithm;

import com.checkpoint.review.entity.ReviewState;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class ReviewTransitionCalculator {

    private static final Map<Integer, Integer> INTERVAL_DAYS = Map.of(
            1, 1,
            2, 3,
            3, 7,
            4, 14,
            5, 30
    );

    public static final int MIN_STAGE = 1;
    public static final int MAX_STAGE = 5;

    public record Input(
            boolean isNewProgress,
            int currentStage,
            boolean correct,
            boolean sameCalendarDayAsLastAnswer
    ) {
        public static Input firstEncounter(boolean correct) {
            return new Input(true, MIN_STAGE, correct, false);
        }

        public static Input existing(int currentStage, boolean correct, boolean sameCalendarDayAsLastAnswer) {
            return new Input(false, currentStage, correct, sameCalendarDayAsLastAnswer);
        }
    }

    public record Result(ReviewState newState, int newStage, int intervalDays, boolean scheduleChanged) {
    }

    public Result transition(Input input) {
        if (input.isNewProgress()) {
            int stage = MIN_STAGE;
            ReviewState state = input.correct() ? ReviewState.STABLE : ReviewState.NEEDS_REVIEW;
            return new Result(state, stage, intervalFor(stage), true);
        }

        if (input.correct()) {
            if (input.sameCalendarDayAsLastAnswer()) {
                return new Result(ReviewState.STABLE, input.currentStage(), intervalFor(input.currentStage()), false);
            }
            int newStage = Math.min(input.currentStage() + 1, MAX_STAGE);
            return new Result(ReviewState.STABLE, newStage, intervalFor(newStage), true);
        }

        int newStage = Math.max(input.currentStage() - 1, MIN_STAGE);
        return new Result(ReviewState.NEEDS_REVIEW, newStage, intervalFor(newStage), true);
    }

    public static int intervalFor(int stage) {
        Integer days = INTERVAL_DAYS.get(stage);
        if (days == null) {
            throw new IllegalArgumentException("Invalid review stage: " + stage + " (must be 1-5)");
        }
        return days;
    }
}
