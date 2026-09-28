package com.checkpoint.review.algorithm;

import com.checkpoint.review.entity.ReviewState;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Implements the exact transition rules from
 * docs/08-Review-Learning-Algorithm.md, sections 3-8 and 13. Deliberately
 * has zero dependency on Spring, JPA, or the database — pure input/output
 * so the rules can be unit tested directly, fast and without a context.
 *
 * ReviewProgressService is the thin persistence wrapper around this class.
 */
@Component
public class ReviewTransitionCalculator {

    /** Section 3: five fixed stages, deliberately simple for V1. */
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

    /**
     * @param scheduleChanged false only in the "same-day repeat correct
     *                        answer" case (section 13) — the caller should
     *                        leave nextReviewAt untouched in that case,
     *                        since nothing about the schedule actually
     *                        changed; true in every other case, meaning
     *                        the caller should set
     *                        nextReviewAt = now + Duration.ofDays(intervalDays).
     */
    public record Result(ReviewState newState, int newStage, int intervalDays, boolean scheduleChanged) {
    }

    public Result transition(Input input) {
        if (input.isNewProgress()) {
            // Section 4: first encounter always lands on stage 1, in
            // either direction depending on correctness.
            int stage = MIN_STAGE;
            ReviewState state = input.correct() ? ReviewState.STABLE : ReviewState.NEEDS_REVIEW;
            return new Result(state, stage, intervalFor(stage), true);
        }

        if (input.correct()) {
            if (input.sameCalendarDayAsLastAnswer()) {
                // Section 13 (Fast Practice safeguard, applied universally
                // for consistency): at most one stage advance per calendar
                // day. Further same-day correct answers reinforce the
                // existing schedule rather than pushing it out further.
                return new Result(ReviewState.STABLE, input.currentStage(), intervalFor(input.currentStage()), false);
            }
            // Section 5/8: correct answer advances one stage, capped at 5.
            int newStage = Math.min(input.currentStage() + 1, MAX_STAGE);
            return new Result(ReviewState.STABLE, newStage, intervalFor(newStage), true);
        }

        // Section 6/7: wrong answer steps back exactly one stage (never
        // reset to zero — "one mistake should not erase accumulated
        // learning"), floored at stage 1. No same-day cap here — section
        // 13 explicitly allows wrong answers to always trigger review
        // regardless of same-day history.
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
