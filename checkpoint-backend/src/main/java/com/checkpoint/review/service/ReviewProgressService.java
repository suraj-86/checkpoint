package com.checkpoint.review.service;

import com.checkpoint.question.entity.Question;
import com.checkpoint.review.algorithm.ReviewTransitionCalculator;
import com.checkpoint.review.entity.UserQuestionProgress;
import com.checkpoint.review.repository.UserQuestionProgressRepository;
import com.checkpoint.user.entity.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;

@Service
public class ReviewProgressService {

    private final UserQuestionProgressRepository progressRepository;
    private final ReviewTransitionCalculator calculator;

    public ReviewProgressService(UserQuestionProgressRepository progressRepository,
                                  ReviewTransitionCalculator calculator) {
        this.progressRepository = progressRepository;
        this.calculator = calculator;
    }

    @Transactional
    public UserQuestionProgress recordAnswer(User user, Question question, boolean correct, Instant now) {
        UserQuestionProgress progress = progressRepository
                .findByUserIdAndQuestionId(user.getId(), question.getId())
                .orElse(null);

        ReviewTransitionCalculator.Input input = progress == null
                ? ReviewTransitionCalculator.Input.firstEncounter(correct)
                : ReviewTransitionCalculator.Input.existing(
                        progress.getReviewStage(), correct, isSameCalendarDay(progress.getLastAnsweredAt(), now));

        ReviewTransitionCalculator.Result result = calculator.transition(input);

        if (progress == null) {
            progress = UserQuestionProgress.builder()
                    .user(user)
                    .question(question)
                    .build();
        }

        progress.setTimesSeen(progress.getTimesSeen() + 1);
        if (correct) {
            progress.setTimesCorrect(progress.getTimesCorrect() + 1);
            progress.setConsecutiveCorrect(progress.getConsecutiveCorrect() + 1);
            progress.setConsecutiveWrong(0);
        } else {
            progress.setTimesWrong(progress.getTimesWrong() + 1);
            progress.setConsecutiveWrong(progress.getConsecutiveWrong() + 1);
            progress.setConsecutiveCorrect(0);
        }

        progress.setReviewState(result.newState());
        progress.setReviewStage((short) result.newStage());
        if (result.scheduleChanged()) {
            progress.setNextReviewAt(now.plus(Duration.ofDays(result.intervalDays())));
        }
        progress.setLastAnsweredAt(now);

        return progressRepository.save(progress);
    }

    private boolean isSameCalendarDay(Instant a, Instant b) {
        if (a == null) {
            return false;
        }
        return a.truncatedTo(ChronoUnit.DAYS).atZone(ZoneOffset.UTC).toLocalDate()
                .equals(b.truncatedTo(ChronoUnit.DAYS).atZone(ZoneOffset.UTC).toLocalDate());
    }
}
