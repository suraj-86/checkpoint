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

        BigDecimal accuracy = totalAttempts == 0
                ? BigDecimal.ZERO
                : BigDecimal.valueOf(correct)
                        .divide(BigDecimal.valueOf(totalAttempts), 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100))
                        .setScale(2, RoundingMode.HALF_UP);

        return new ProgressOverallResponse(distinctQuestions, totalAttempts, correct, wrong, accuracy, needsReview, stable);
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
                .sorted((a, b) -> b.questionsAttempted() > a.questionsAttempted() ? 1 : -1)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ActivityDayPoint> getActivity(User user, int days) {
        Instant since = Instant.now(clock).truncatedTo(ChronoUnit.DAYS).minus(days, ChronoUnit.DAYS);

        return sessionRepository.findActivitySince(user.getId(), since).stream()
                .map(row -> {
                    // Native query row: [0]=timestamp, [1]=count (bigint), [2]=xp sum (bigint).
                    Instant bucketStart = ((java.sql.Timestamp) row[0]).toInstant();
                    LocalDate date = bucketStart.atZone(ZoneOffset.UTC).toLocalDate();
                    long sessionCount = ((Number) row[1]).longValue();
                    int xpTotal = ((Number) row[2]).intValue();
                    return new ActivityDayPoint(date, sessionCount, xpTotal);
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public PageResponse<SessionSummary> getSessionHistory(User user, Pageable pageable) {
        return PageResponse.from(
                sessionRepository.findByUserIdOrderByStartedAtDesc(user.getId(), pageable).map(SessionSummary::from));
    }
}
