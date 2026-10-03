package com.checkpoint.xp.service;

import com.checkpoint.practice.entity.PracticeSession;
import com.checkpoint.practice.entity.QuestionAttempt;
import com.checkpoint.practice.entity.SessionType;
import com.checkpoint.practice.repository.PracticeSessionRepository;
import com.checkpoint.practice.repository.QuestionAttemptRepository;
import com.checkpoint.question.entity.Difficulty;
import com.checkpoint.question.entity.Question;
import com.checkpoint.user.entity.User;
import com.checkpoint.xp.algorithm.LevelCalculator;
import com.checkpoint.xp.algorithm.StreakCalculator;
import com.checkpoint.xp.entity.StudentStats;
import com.checkpoint.xp.repository.StudentStatsRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class XpAwardServiceTest {

    @Mock private StudentStatsRepository studentStatsRepository;
    @Mock private QuestionAttemptRepository attemptRepository;
    @Mock private PracticeSessionRepository sessionRepository;

    private XpAwardService service;
    private final UUID userId = UUID.randomUUID();
    private final Clock clock = Clock.fixed(Instant.parse("2026-10-01T12:00:00Z"), ZoneOffset.UTC);

    @BeforeEach
    void setUp() {
        service = new XpAwardService(
                studentStatsRepository, attemptRepository, sessionRepository,
                new LevelCalculator(), new StreakCalculator(), clock);
        lenient().when(studentStatsRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    private User user() {
        return User.builder().id(userId).username("tester").build();
    }

    private PracticeSession session(SessionType type) {
        return PracticeSession.builder().id(UUID.randomUUID()).user(user()).sessionType(type).build();
    }

    private QuestionAttempt correctAttempt(Difficulty difficulty, boolean correct) {
        Question q = Question.builder().id(UUID.randomUUID()).difficulty(difficulty).build();
        return QuestionAttempt.builder().question(q).correct(correct).primary(true).build();
    }

    @Nested
    @DisplayName("Fast Practice daily cap (section 13)")
    class FastPracticeCap {

        @Test
        @DisplayName("a positive Fast Practice award is reduced to whatever cap room remains")
        void reducesToRemainingCapRoom() {
            when(studentStatsRepository.findByUserId(userId)).thenReturn(Optional.empty());
            List<QuestionAttempt> attempts = List.of(
                    correctAttempt(Difficulty.MEDIUM, true), correctAttempt(Difficulty.MEDIUM, true),
                    correctAttempt(Difficulty.MEDIUM, true), correctAttempt(Difficulty.MEDIUM, true),
                    correctAttempt(Difficulty.MEDIUM, true), correctAttempt(Difficulty.MEDIUM, true),
                    correctAttempt(Difficulty.MEDIUM, true), correctAttempt(Difficulty.MEDIUM, true),
                    correctAttempt(Difficulty.MEDIUM, true), correctAttempt(Difficulty.MEDIUM, true)
            );
            PracticeSession s = session(SessionType.FAST);
            when(attemptRepository.findBySessionIdAndPrimaryTrue(s.getId())).thenReturn(attempts);
            when(sessionRepository.sumPositiveFastXpToday(eq(userId), any(), any())).thenReturn(490);

            XpAwardService.AwardResult result = service.award(s);

            assertThat(result.xpChange()).isEqualTo(10);
        }

        @Test
        @DisplayName("once the cap is fully used, further positive Fast Practice XP is zero, not negative or an error")
        void fullyCappedYieldsZero() {
            when(studentStatsRepository.findByUserId(userId)).thenReturn(Optional.empty());
            List<QuestionAttempt> attempts = List.of(correctAttempt(Difficulty.MEDIUM, true));
            PracticeSession s = session(SessionType.FAST);
            when(attemptRepository.findBySessionIdAndPrimaryTrue(s.getId())).thenReturn(attempts);
            when(sessionRepository.sumPositiveFastXpToday(eq(userId), any(), any())).thenReturn(500);

            XpAwardService.AwardResult result = service.award(s);

            assertThat(result.xpChange()).isGreaterThanOrEqualTo(0);
            assertThat(result.xpChange()).isEqualTo(0);
        }

        @Test
        @DisplayName("negative Fast Practice XP is never capped — a loss always applies in full")
        void negativeXpIsNeverCapped() {
            when(studentStatsRepository.findByUserId(userId)).thenReturn(
                    Optional.of(StudentStats.builder().userId(userId).totalXp(10_000).build()));
            List<QuestionAttempt> attempts = List.of(
                    correctAttempt(Difficulty.MEDIUM, false), correctAttempt(Difficulty.MEDIUM, false));
            PracticeSession s = session(SessionType.FAST);
            when(attemptRepository.findBySessionIdAndPrimaryTrue(s.getId())).thenReturn(attempts);
            lenient().when(sessionRepository.sumPositiveFastXpToday(eq(userId), any(), any())).thenReturn(500);

            XpAwardService.AwardResult result = service.award(s);

            assertThat(result.xpChange()).isLessThan(0);
        }
    }

    @Nested
    @DisplayName("Streak routing (section 15: Fast Practice must never touch streak)")
    class StreakRouting {

        @Test
        @DisplayName("a completed DAILY session updates the streak")
        void dailySessionUpdatesStreak() {
            when(studentStatsRepository.findByUserId(userId)).thenReturn(
                    Optional.of(StudentStats.builder().userId(userId).currentStreak(0).longestStreak(0).build()));
            PracticeSession s = session(SessionType.DAILY);
            when(attemptRepository.findBySessionIdAndPrimaryTrue(s.getId()))
                    .thenReturn(List.of(correctAttempt(Difficulty.MEDIUM, true)));

            ArgumentCaptor<StudentStats> captor = ArgumentCaptor.forClass(StudentStats.class);
            service.award(s);
            verify(studentStatsRepository).save(captor.capture());

            assertThat(captor.getValue().getCurrentStreak()).isEqualTo(1);
            assertThat(captor.getValue().getTotalDailySessions()).isEqualTo(1);
            assertThat(captor.getValue().getTotalFastSessions()).isEqualTo(0);
        }

        @Test
        @DisplayName("a completed FAST session leaves the streak completely untouched")
        void fastSessionNeverTouchesStreak() {
            when(studentStatsRepository.findByUserId(userId)).thenReturn(
                    Optional.of(StudentStats.builder().userId(userId).currentStreak(5).longestStreak(5).build()));
            PracticeSession s = session(SessionType.FAST);
            when(attemptRepository.findBySessionIdAndPrimaryTrue(s.getId()))
                    .thenReturn(List.of(correctAttempt(Difficulty.MEDIUM, true)));
            when(sessionRepository.sumPositiveFastXpToday(eq(userId), any(), any())).thenReturn(0);

            ArgumentCaptor<StudentStats> captor = ArgumentCaptor.forClass(StudentStats.class);
            service.award(s);
            verify(studentStatsRepository).save(captor.capture());

            assertThat(captor.getValue().getCurrentStreak()).isEqualTo(5);
            assertThat(captor.getValue().getTotalFastSessions()).isEqualTo(1);
            assertThat(captor.getValue().getTotalDailySessions()).isEqualTo(0);
        }
    }

    @Nested
    @DisplayName("Total XP floor")
    class XpFloor {

        @Test
        @DisplayName("total XP is never allowed to go negative, even after a large loss")
        void totalXpNeverGoesNegative() {
            when(studentStatsRepository.findByUserId(userId)).thenReturn(
                    Optional.of(StudentStats.builder().userId(userId).totalXp(5).build()));
            PracticeSession s = session(SessionType.DAILY);
            when(attemptRepository.findBySessionIdAndPrimaryTrue(s.getId()))
                    .thenReturn(List.of(correctAttempt(Difficulty.MEDIUM, false)));

            XpAwardService.AwardResult result = service.award(s);

            assertThat(result.totalXp()).isEqualTo(0);
        }
    }
}
