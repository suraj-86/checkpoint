package com.checkpoint.review.service;

import com.checkpoint.question.entity.Question;
import com.checkpoint.review.entity.UserQuestionProgress;
import com.checkpoint.review.repository.UserQuestionProgressRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class QuestionSelectionService {

    private static final double NEW_QUESTION_RESERVE_FRACTION = 0.3;

    private static final Object NO_TOPIC = new Object();

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
        return selectForSession(userId, count, now, Set.of());
    }

    @Transactional(readOnly = true)
    public SelectionResult selectForSession(UUID userId, int count, Instant now, Set<UUID> interestTopicIds) {
        Instant startOfToday = now.truncatedTo(ChronoUnit.DAYS);
        Instant startOfTomorrow = startOfToday.plus(1, ChronoUnit.DAYS);

        List<UserQuestionProgress> needsReview = progressRepository.findNeedsReview(userId);
        List<UserQuestionProgress> overdue = progressRepository.findOverdue(userId, startOfToday);
        List<UserQuestionProgress> dueToday = progressRepository.findDueToday(userId, startOfToday, startOfTomorrow);
        List<Question> neverAttempted = progressRepository.findNeverAttempted(userId);

        Set<Question> reviewPool = new LinkedHashSet<>();
        needsReview.forEach(p -> reviewPool.add(p.getQuestion()));
        overdue.forEach(p -> reviewPool.add(p.getQuestion()));
        dueToday.forEach(p -> reviewPool.add(p.getQuestion()));

        List<Question> reviewList = new ArrayList<>(reviewPool);
        List<Question> newList = new ArrayList<>(neverAttempted);

        if (interestTopicIds != null && !interestTopicIds.isEmpty()) {
            List<Question> interestingReview = filterByTopics(reviewList, interestTopicIds);
            List<Question> interestingNew = filterByTopics(newList, interestTopicIds);
            // If nothing is available in the chosen topics, fall back to all topics
            // so the student can still practice.
            if (!interestingReview.isEmpty() || !interestingNew.isEmpty()) {
                reviewList = interestingReview;
                newList = interestingNew;
            }
        }

        newList = interleaveByTopic(newList);

        List<Question> selected = balance(reviewList, newList, count);

        return new SelectionResult(selected, needsReview.size(), overdue.size(), dueToday.size(), neverAttempted.size());
    }

    static List<Question> filterByTopics(List<Question> questions, Set<UUID> topicIds) {
        return new ArrayList<>(questions.stream()
                .filter(q -> q.getTopic() != null && topicIds.contains(q.getTopic().getId()))
                .toList());
    }

    /**
     * Mixes questions from different topics (round-robin) while keeping each
     * topic's own order, so a session is not filled by whichever topic was
     * imported first.
     */
    static List<Question> interleaveByTopic(List<Question> questions) {
        Map<Object, Deque<Question>> groups = new LinkedHashMap<>();
        for (Question q : questions) {
            Object key = q.getTopic() == null ? NO_TOPIC : q.getTopic().getId();
            groups.computeIfAbsent(key, k -> new ArrayDeque<>()).add(q);
        }

        List<Question> result = new ArrayList<>(questions.size());
        while (result.size() < questions.size()) {
            for (Deque<Question> group : groups.values()) {
                Question next = group.pollFirst();
                if (next != null) {
                    result.add(next);
                }
            }
        }
        return result;
    }

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
