package com.checkpoint.xp.service;

import com.checkpoint.practice.entity.PracticeSession;
import com.checkpoint.practice.entity.QuestionAttempt;
import com.checkpoint.practice.entity.SessionType;
import com.checkpoint.practice.repository.PracticeSessionRepository;
import com.checkpoint.practice.repository.QuestionAttemptRepository;
import com.checkpoint.xp.algorithm.LevelCalculator;
import com.checkpoint.xp.algorithm.StreakCalculator;
import com.checkpoint.xp.algorithm.XpCalculator;
import com.checkpoint.xp.entity.StudentStats;
import com.checkpoint.xp.repository.StudentStatsRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
public class XpAwardService {

    private static final int FAST_PRACTICE_DAILY_CAP = 500;

    private final StudentStatsRepository studentStatsRepository;
    private final QuestionAttemptRepository attemptRepository;
    private final PracticeSessionRepository sessionRepository;
    private final LevelCalculator levelCalculator;
    private final XpCalculator xpCalculator;
    private final StreakCalculator streakCalculator;
    private final Clock clock;

    public XpAwardService(
            StudentStatsRepository studentStatsRepository,
            QuestionAttemptRepository attemptRepository,
            PracticeSessionRepository sessionRepository,
            LevelCalculator levelCalculator,
            StreakCalculator streakCalculator,
            Clock clock
    ) {
        this.studentStatsRepository = studentStatsRepository;
        this.attemptRepository = attemptRepository;
        this.sessionRepository = sessionRepository;
        this.levelCalculator = levelCalculator;
        this.xpCalculator = new XpCalculator(levelCalculator);
        this.streakCalculator = streakCalculator;
        this.clock = clock;
    }

    public record AwardResult(
            int xpChange,
            int totalXp,
            int levelBefore,
            int levelAfter,
            boolean leveledUp,
            int currentStreak,
            int longestStreak,
            int streakMilestoneBonus
    ) {
    }

    @Transactional
    public AwardResult award(PracticeSession session) {
        UUID userId = session.getUser().getId();
        StudentStats stats = studentStatsRepository.findByUserId(userId)
                .orElseGet(() -> StudentStats.builder().userId(userId).build());

        int totalXpBefore = stats.getTotalXp();
        int levelBefore = levelCalculator.levelForXp(totalXpBefore);

        List<XpCalculator.AnsweredQuestion> answered = attemptRepository
                .findBySessionIdAndPrimaryTrue(session.getId()).stream()
                .map(this::toAnsweredQuestion)
                .toList();

        XpCalculator.Result xpResult = xpCalculator.calculate(answered, totalXpBefore, session.getSessionType());
        int sessionXp = xpResult.xpChange();

        if (session.getSessionType() == SessionType.FAST && sessionXp > 0) {
            sessionXp = applyFastPracticeCap(userId, sessionXp);
        }

        int streakBonus = 0;
        if (session.getSessionType() == SessionType.DAILY) {
            LocalDate today = LocalDate.now(clock.withZone(ZoneOffset.UTC));
            StreakCalculator.Result streakResult = streakCalculator.onQualifyingDailySession(
                    stats.getCurrentStreak(), stats.getLongestStreak(), stats.getLastDailySessionDate(), today);

            stats.setCurrentStreak(streakResult.newCurrentStreak());
            stats.setLongestStreak(streakResult.newLongestStreak());
            stats.setLastDailySessionDate(today);
            stats.setTotalDailySessions(stats.getTotalDailySessions() + 1);
            streakBonus = streakResult.milestoneBonus();
        } else {
            stats.setTotalFastSessions(stats.getTotalFastSessions() + 1);
        }

        int totalChange = sessionXp + streakBonus;
        int newTotalXp = Math.max(0, totalXpBefore + totalChange);
        stats.setTotalXp(newTotalXp);

        studentStatsRepository.save(stats);

        int levelAfter = levelCalculator.levelForXp(newTotalXp);

        return new AwardResult(
                totalChange,
                newTotalXp,
                levelBefore,
                levelAfter,
                levelAfter > levelBefore,
                stats.getCurrentStreak(),
                stats.getLongestStreak(),
                streakBonus
        );
    }

    private XpCalculator.AnsweredQuestion toAnsweredQuestion(QuestionAttempt attempt) {
        return new XpCalculator.AnsweredQuestion(attempt.getQuestion().getDifficulty(), attempt.isCorrect());
    }

    private int applyFastPracticeCap(UUID userId, int sessionXp) {
        Instant startOfToday = Instant.now(clock).truncatedTo(ChronoUnit.DAYS);
        Instant startOfTomorrow = startOfToday.plus(1, ChronoUnit.DAYS);

        int alreadyAwardedToday = sessionRepository.sumPositiveFastXpToday(userId, startOfToday, startOfTomorrow);
        int remaining = Math.max(0, FAST_PRACTICE_DAILY_CAP - alreadyAwardedToday);

        return Math.min(sessionXp, remaining);
    }
}
