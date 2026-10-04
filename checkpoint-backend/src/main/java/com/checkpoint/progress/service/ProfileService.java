package com.checkpoint.progress.service;

import com.checkpoint.practice.entity.SessionStatus;
import com.checkpoint.practice.repository.PracticeSessionRepository;
import com.checkpoint.progress.dto.DashboardResponse;
import com.checkpoint.progress.dto.ProfileResponse;
import com.checkpoint.progress.dto.SessionSummary;
import com.checkpoint.review.entity.ReviewState;
import com.checkpoint.review.repository.UserQuestionProgressRepository;
import com.checkpoint.user.entity.User;
import com.checkpoint.xp.algorithm.LevelCalculator;
import com.checkpoint.xp.entity.StudentStats;
import com.checkpoint.xp.repository.StudentStatsRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
public class ProfileService {

    private final StudentStatsRepository studentStatsRepository;
    private final PracticeSessionRepository sessionRepository;
    private final UserQuestionProgressRepository progressRepository;
    private final LevelCalculator levelCalculator;
    private final Clock clock;

    public ProfileService(
            StudentStatsRepository studentStatsRepository,
            PracticeSessionRepository sessionRepository,
            UserQuestionProgressRepository progressRepository,
            LevelCalculator levelCalculator,
            Clock clock
    ) {
        this.studentStatsRepository = studentStatsRepository;
        this.sessionRepository = sessionRepository;
        this.progressRepository = progressRepository;
        this.levelCalculator = levelCalculator;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public ProfileResponse getProfile(User user) {
        // A student who hasn't completed a session yet has no StudentStats
        // row (XpAwardService only creates one on first completion — see
        // its javadoc). The profile view must still work for them, so a
        // missing row is treated as all-zero stats here rather than 404
        // or lazily creating a row from a read-only endpoint.
        StudentStats stats = studentStatsRepository.findByUserId(user.getId())
                .orElseGet(() -> StudentStats.builder().userId(user.getId()).build());

        return new ProfileResponse(
                user.getId(),
                user.getUsername(),
                user.getRole().name(),
                stats.getTotalXp(),
                levelCalculator.levelForXp(stats.getTotalXp()),
                stats.getCurrentStreak(),
                stats.getLongestStreak(),
                stats.getTotalDailySessions(),
                stats.getTotalFastSessions()
        );
    }

    @Transactional(readOnly = true)
    public DashboardResponse getDashboard(User user) {
        StudentStats stats = studentStatsRepository.findByUserId(user.getId())
                .orElseGet(() -> StudentStats.builder().userId(user.getId()).build());

        Instant now = Instant.now(clock);
        Instant startOfToday = now.truncatedTo(ChronoUnit.DAYS);
        Instant startOfTomorrow = startOfToday.plus(1, ChronoUnit.DAYS);

        boolean dailyDoneToday = sessionRepository.existsCompletedDailySessionToday(
                user.getId(), startOfToday, startOfTomorrow);
        boolean hasActive = sessionRepository
                .findByUserIdAndStatus(user.getId(), SessionStatus.IN_PROGRESS).isPresent();

        long needsReview = progressRepository.countByUserIdAndReviewState(user.getId(), ReviewState.NEEDS_REVIEW);
        long overdue = progressRepository.findOverdue(user.getId(), startOfToday).size();

        var recent = sessionRepository
                .findTop5ByUserIdAndStatusOrderByCompletedAtDesc(user.getId(), SessionStatus.COMPLETED)
                .stream().map(SessionSummary::from).toList();

        return new DashboardResponse(
                user.getUsername(),
                levelCalculator.levelForXp(stats.getTotalXp()),
                stats.getTotalXp(),
                stats.getCurrentStreak(),
                stats.getLongestStreak(),
                dailyDoneToday,
                hasActive,
                needsReview + overdue,
                recent
        );
    }
}
