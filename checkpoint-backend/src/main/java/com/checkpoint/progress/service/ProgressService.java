package com.checkpoint.progress.service;

import com.checkpoint.common.dto.PageResponse;
import com.checkpoint.practice.repository.PracticeSessionRepository;
import com.checkpoint.progress.dto.ActivityDayPoint;
import com.checkpoint.progress.dto.ProgressOverallResponse;
import com.checkpoint.progress.dto.SessionSummary;
import com.checkpoint.progress.dto.TopicPerformance;
import com.checkpoint.review.entity.ReviewState;
import com.checkpoint.review.entity.UserQuestionProgress;
import com.checkpoint.review.repository.UserQuestionProgressRepository;
import com.checkpoint.user.entity.User;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ProgressService {

    private final UserQuestionProgressRepository progressRepository;
    private final PracticeSessionRepository sessionRepository;
    private final Clock clock;

    public ProgressService(
            UserQuestionProgressRepository progressRepository,
            PracticeSessionRepository sessionRepository,
            Clock clock
    ) {
        this.progressRepository = progressRepository;
        this.sessionRepository = sessionRepository;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public ProgressOverallResponse getOverall(User user) {
        UUID userId = user.getId();

        long distinctQuestions = progressRepository.countByUserId(userId);
        long totalAttempts = progressRepository.sumTimesSeen(userId);
        long correct = progressRepository.sumTimesCorrect(userId);
        long wrong = progressRepository.sumTimesWrong(userId);
        long needsReview = progressRepository.countByUserIdAndReviewState(userId, ReviewState.NEEDS_REVIEW);
        long stable = progressRepository.countByUserIdAndReviewState(userId, ReviewState.STABLE);

        // Same definition the dashboard uses: questions answered wrong last time, plus
        // correctly answered ones whose scheduled review date has already passed.
        Instant startOfToday = Instant.now(clock).truncatedTo(ChronoUnit.DAYS);
        long overdue = progressRepository.findOverdue(userId, startOfToday).size();

        BigDecimal accuracy = totalAttempts == 0
                ? BigDecimal.ZERO
                : BigDecimal.valueOf(correct)
                        .divide(BigDecimal.valueOf(totalAttempts), 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100))
                        .setScale(2, RoundingMode.HALF_UP);

        return new ProgressOverallResponse(distinctQuestions, totalAttempts, correct, wrong, accuracy, needsReview, stable, overdue, needsReview + overdue);
    }

    @Transactional(readOnly = true)
    public List<TopicPerformance> getTopicPerformance(User user) {
        List<UserQuestionProgress> rows = progressRepository.findAllByUserIdWithQuestionAndTopic(user.getId());

        Map<UUID, List<UserQuestionProgress>> byTopic = rows.stream()
                .collect(Collectors.groupingBy(p -> p.getQuestion().getTopic().getId()));

        return byTopic.entrySet().stream()
                .map(entry -> {
                    List<UserQuestionProgress> topicRows = entry.getValue();
                    String topicName = topicRows.get(0).getQuestion().getTopic().getName();
                    long attempted = topicRows.stream().mapToLong(UserQuestionProgress::getTimesSeen).sum();
                    long correct = topicRows.stream().mapToLong(UserQuestionProgress::getTimesCorrect).sum();
                    BigDecimal accuracy = attempted == 0
                            ? BigDecimal.ZERO
                            : BigDecimal.valueOf(correct)
                                    .divide(BigDecimal.valueOf(attempted), 4, RoundingMode.HALF_UP)
                                    .multiply(BigDecimal.valueOf(100))
                                    .setScale(2, RoundingMode.HALF_UP);
                    return new TopicPerformance(entry.getKey(), topicName, attempted, correct, accuracy);
                })
                .sorted(Comparator.comparingLong(TopicPerformance::questionsAttempted).reversed()
                        .thenComparing(TopicPerformance::topicName))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ActivityDayPoint> getActivity(User user, int days) {
        Instant since = Instant.now(clock).truncatedTo(ChronoUnit.DAYS).minus(days, ChronoUnit.DAYS);

        return sessionRepository.findActivitySince(user.getId(), since).stream()
                .map(row -> new ActivityDayPoint(
                        toLocalDate(row[0]),
                        ((Number) row[1]).longValue(),
                        ((Number) row[2]).intValue()))
                .toList();
    }

    static LocalDate toLocalDate(Object value) {
        if (value instanceof LocalDate date) {
            return date;
        }
        if (value instanceof java.sql.Date date) {
            return date.toLocalDate();
        }
        if (value instanceof Instant instant) {
            return instant.atZone(ZoneOffset.UTC).toLocalDate();
        }
        if (value instanceof java.sql.Timestamp timestamp) {
            return timestamp.toInstant().atZone(ZoneOffset.UTC).toLocalDate();
        }
        if (value instanceof java.time.OffsetDateTime dateTime) {
            return dateTime.withOffsetSameInstant(ZoneOffset.UTC).toLocalDate();
        }
        throw new IllegalStateException("Unsupported activity date type: "
                + (value == null ? "null" : value.getClass().getName()));
    }

    @Transactional(readOnly = true)
    public PageResponse<SessionSummary> getSessionHistory(User user, Pageable pageable) {
        return PageResponse.from(
                sessionRepository.findByUserIdOrderByStartedAtDesc(user.getId(), pageable).map(SessionSummary::from));
    }
}
