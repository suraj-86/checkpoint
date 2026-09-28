package com.checkpoint.review.service;

import com.checkpoint.question.entity.Question;
import com.checkpoint.review.entity.UserQuestionProgress;
import com.checkpoint.review.repository.UserQuestionProgressRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Chooses which questions a session should show, per
 * docs/08-Review-Learning-Algorithm.md section 11:
 *
 * Priority order: needs-review, then overdue, then due-today, then new.
 * But the result is BALANCED — the docs explicitly warn against an
 * all-review session "unless the student genuinely has an extreme
 * backlog." The exact balancing mechanics aren't specified further, so
 * this implementation documents its own concrete rule (see selectForSession
 * javadoc) rather than silently guessing.
 */
@Service
public class QuestionSelectionService {

    /**
     * When the review backlog (needs-review + overdue + due-today) is
     * smaller than the session size, we reserve roughly this fraction of
     * the session for new questions, so a student with a light backlog
     * still sees fresh material rather than being shown, say, 3 review
     * questions and nothing else for a requested session of 15.
     */
    private static final double NEW_QUESTION_RESERVE_FRACTION = 0.3;

    private final UserQuestionProgressRepository progressRepository;

    public QuestionSelectionService(UserQuestionProgressRepository progressRepository) {
        this.progressRepository = progressRepository;
    }

    public record SelectionResult(
            List<Question> questions,
            int needsReviewAvailable,
            int overdueAvailable,
            int dueTodayAvailable,
            int newAvailable
    ) {
    }

    @Transactional(readOnly = true)
    public SelectionResult selectForSession(UUID userId, int count, Instant now) {
        Instant startOfToday = now.truncatedTo(ChronoUnit.DAYS);
        Instant startOfTomorrow = startOfToday.plus(1, ChronoUnit.DAYS);

        List<UserQuestionProgress> needsReview = progressRepository.findNeedsReview(userId);
        List<UserQuestionProgress> overdue = progressRepository.findOverdue(userId, startOfToday);
        List<UserQuestionProgress> dueToday = progressRepository.findDueToday(userId, startOfToday, startOfTomorrow);
        List<Question> neverAttempted = progressRepository.findNeverAttempted(userId);

        // Priority-ordered review pool, de-duplicated (a question can't
        // realistically be in two of these lists at once given the state
        // machine, but dedupe defensively rather than assume).
        Set<Question> reviewPool = new LinkedHashSet<>();
        needsReview.forEach(p -> reviewPool.add(p.getQuestion()));
        overdue.forEach(p -> reviewPool.add(p.getQuestion()));
        dueToday.forEach(p -> reviewPool.add(p.getQuestion()));

        List<Question> reviewList = new ArrayList<>(reviewPool);
        List<Question> newList = new ArrayList<>(neverAttempted);

        List<Question> selected = balance(reviewList, newList, count);

        return new SelectionResult(selected, needsReview.size(), overdue.size(), dueToday.size(), neverAttempted.size());
    }

    /**
     * Concrete balancing rule: if the review backlog alone already meets
     * or exceeds the requested session size, fill entirely from review
     * (the "extreme backlog" case — new questions wait). Otherwise reserve
     * NEW_QUESTION_RESERVE_FRACTION of the session for new questions (at
     * least one slot, if any new questions exist), and fill the rest from
     * review, topping up from whichever pool has leftover capacity if the
     * other runs short.
     */
    private List<Question> balance(List<Question> reviewPool, List<Question> newPool, int count) {
        List<Question> result = new ArrayList<>();

        if (count <= 0) {
            return result;
        }

        int newQuota;
        if (reviewPool.size() >= count) {
            newQuota = 0;
        } else {
            newQuota = Math.max(1, (int) Math.round(count * NEW_QUESTION_RESERVE_FRACTION));
        }
        newQuota = Math.min(newQuota, newPool.size());

        int reviewQuota = count - newQuota;
        reviewQuota = Math.min(reviewQuota, reviewPool.size());

        result.addAll(reviewPool.subList(0, reviewQuota));
        result.addAll(newPool.subList(0, newQuota));

        // If either pool came up short of its quota, top up from the
        // other pool's remainder so we still return `count` questions
        // whenever enough material exists across both pools combined.
        int shortfall = count - result.size();
        if (shortfall > 0) {
            List<Question> reviewRemainder = reviewPool.subList(reviewQuota, reviewPool.size());
            List<Question> newRemainder = newPool.subList(newQuota, newPool.size());

            for (Question q : reviewRemainder) {
                if (shortfall == 0) break;
                result.add(q);
                shortfall--;
            }
            for (Question q : newRemainder) {
                if (shortfall == 0) break;
                result.add(q);
                shortfall--;
            }
        }

        return result;
    }
}
