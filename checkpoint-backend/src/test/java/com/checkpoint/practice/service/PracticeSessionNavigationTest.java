package com.checkpoint.practice.service;

import com.checkpoint.common.exception.BadRequestException;
import com.checkpoint.interest.repository.UserInterestRepository;
import com.checkpoint.practice.dto.ActiveSessionResponse;
import com.checkpoint.practice.dto.SessionAbandonResponse;
import com.checkpoint.practice.dto.SessionCompletionResponse;
import com.checkpoint.practice.dto.SlotQuestionResponse;
import com.checkpoint.practice.entity.PracticeSession;
import com.checkpoint.practice.entity.QuestionAttempt;
import com.checkpoint.practice.entity.SessionQuestion;
import com.checkpoint.practice.entity.SessionStatus;
import com.checkpoint.practice.entity.SessionType;
import com.checkpoint.practice.repository.PracticeSessionRepository;
import com.checkpoint.practice.repository.QuestionAttemptRepository;
import com.checkpoint.practice.repository.SessionQuestionRepository;
import com.checkpoint.question.entity.Difficulty;
import com.checkpoint.question.entity.Question;
import com.checkpoint.question.entity.QuestionType;
import com.checkpoint.question.repository.QuestionRepository;
import com.checkpoint.review.service.QuestionSelectionService;
import com.checkpoint.review.service.ReviewProgressService;
import com.checkpoint.topic.entity.Topic;
import com.checkpoint.user.entity.Role;
import com.checkpoint.user.entity.User;
import com.checkpoint.xp.service.XpAwardService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PracticeSessionNavigationTest {

    @Mock private PracticeSessionRepository sessionRepository;
    @Mock private SessionQuestionRepository sessionQuestionRepository;
    @Mock private QuestionAttemptRepository attemptRepository;
    @Mock private QuestionRepository questionRepository;
    @Mock private QuestionSelectionService selectionService;
    @Mock private ReviewProgressService reviewProgressService;
    @Mock private XpAwardService xpAwardService;
    @Mock private UserInterestRepository interestRepository;
    @Mock private SkippedQuestionService skippedQuestionService;

    private PracticeSessionService service;
    private User user;
    private Topic topic;

    @BeforeEach
    void setUp() {
        service = new PracticeSessionService(
                sessionRepository, sessionQuestionRepository, attemptRepository, questionRepository,
                selectionService, reviewProgressService, new AnswerEvaluator(), xpAwardService,
                interestRepository, skippedQuestionService,
                Clock.fixed(Instant.parse("2026-10-17T10:00:00Z"), ZoneOffset.UTC));
        user = User.builder().id(UUID.randomUUID()).username("u").role(Role.STUDENT).build();
        topic = Topic.builder().id(UUID.randomUUID()).name("Java").build();
    }

    private Question question() {
        return Question.builder()
                .id(UUID.randomUUID()).topic(topic)
                .questionType(QuestionType.MULTIPLE_CHOICE).difficulty(Difficulty.MEDIUM)
                .questionText("q").explanation("because")
                .answerData(Map.of("options", List.of("a", "b", "c", "d"), "correctAnswer", "a"))
                .build();
    }

    private PracticeSession session(SessionType type, int primaryCount, int correct, int wrong) {
        PracticeSession s = PracticeSession.builder()
                .id(UUID.randomUUID()).user(user).sessionType(type).status(SessionStatus.IN_PROGRESS)
                .primaryQuestionCount(primaryCount).correctCount(correct).wrongCount(wrong).build();
        when(sessionRepository.findById(s.getId())).thenReturn(Optional.of(s));
        return s;
    }

    private List<SessionQuestion> slots(PracticeSession s, int total, int answered) {
        List<SessionQuestion> list = new ArrayList<>();
        for (int i = 0; i < total; i++) {
            list.add(SessionQuestion.builder().id(UUID.randomUUID()).session(s).question(question())
                    .queuePosition(i).primary(true).answered(i < answered).build());
        }
        lenient().when(sessionQuestionRepository.findBySessionIdOrderByQueuePositionAsc(s.getId())).thenReturn(list);
        return list;
    }

    private XpAwardService.AwardResult award(int xp) {
        return new XpAwardService.AwardResult(xp, 100, 1, 1, false, 1, 1, 0);
    }

    @Test
    void dailySubmitCountsUnansweredQuestionsAgainstAccuracyAndXp() {
        PracticeSession s = session(SessionType.DAILY, 10, 1, 0);
        slots(s, 10, 1);
        when(xpAwardService.award(eq(s), any())).thenReturn(award(-5));

        SessionCompletionResponse r = service.completeSession(user, s.getId());

        assertThat(r.accuracy()).isEqualByComparingTo(new BigDecimal("10.00"));
        assertThat(r.answeredCount()).isEqualTo(1);
        assertThat(r.unattemptedCount()).isEqualTo(9);
        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<Difficulty>> captor = ArgumentCaptor.forClass(List.class);
        verify(xpAwardService).award(eq(s), captor.capture());
        assertThat(captor.getValue()).hasSize(9);
        verify(skippedQuestionService, never()).addAll(any(), anyCollection());
    }

    @Test
    void fastSubmitScoresOnlyAnsweredQuestionsAndRemembersTheRest() {
        PracticeSession s = session(SessionType.FAST, 10, 3, 1);
        slots(s, 10, 4);
        when(xpAwardService.award(eq(s), any())).thenReturn(award(4));

        SessionCompletionResponse r = service.completeSession(user, s.getId());

        assertThat(r.accuracy()).isEqualByComparingTo(new BigDecimal("75.00"));
        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<Difficulty>> captor = ArgumentCaptor.forClass(List.class);
        verify(xpAwardService).award(eq(s), captor.capture());
        assertThat(captor.getValue()).isEmpty();
        @SuppressWarnings("unchecked")
        ArgumentCaptor<java.util.Collection<Question>> remembered = ArgumentCaptor.forClass(java.util.Collection.class);
        verify(skippedQuestionService).addAll(eq(user), remembered.capture());
        assertThat(remembered.getValue()).hasSize(6);
    }

    @Test
    void submittingWithNothingAnsweredIsRejected() {
        PracticeSession s = session(SessionType.DAILY, 10, 0, 0);
        slots(s, 10, 0);

        assertThatThrownBy(() -> service.completeSession(user, s.getId())).isInstanceOf(BadRequestException.class);

        verify(xpAwardService, never()).award(any(), any());
    }

    @Test
    void aDailySessionCannotBeEndedEarly() {
        PracticeSession s = session(SessionType.DAILY, 10, 2, 0);

        assertThatThrownBy(() -> service.abandonSession(user, s.getId())).isInstanceOf(BadRequestException.class);

        assertThat(s.getStatus()).isEqualTo(SessionStatus.IN_PROGRESS);
    }

    @Test
    void endingAFastSessionRemembersUnansweredQuestionsWithoutXp() {
        PracticeSession s = session(SessionType.FAST, 5, 1, 1);
        slots(s, 5, 2);

        SessionAbandonResponse r = service.abandonSession(user, s.getId());

        assertThat(r.skippedForLater()).isEqualTo(3);
        assertThat(s.getStatus()).isEqualTo(SessionStatus.ABANDONED);
        verify(xpAwardService, never()).award(any(), any());
        verify(skippedQuestionService).addAll(eq(user), anyCollection());
    }

    @Test
    void overviewReportsEachQuestionsStatusAndStartsAtTheFirstUnattemptedOne() {
        PracticeSession s = session(SessionType.FAST, 4, 1, 0);
        List<SessionQuestion> list = slots(s, 4, 1);
        list.get(1).setSkipped(true);
        QuestionAttempt attempt = QuestionAttempt.builder().question(list.get(0).getQuestion()).primary(true)
                .correct(true).session(s).user(user).build();
        when(attemptRepository.findBySessionIdOrderByAnsweredAtAsc(s.getId())).thenReturn(List.of(attempt));

        ActiveSessionResponse r = service.getOverview(user, s.getId());

        assertThat(r.slots()).extracting(slot -> slot.status())
                .containsExactly("CORRECT", "SKIPPED", "NOT_ATTEMPTED", "NOT_ATTEMPTED");
        assertThat(r.currentPosition()).isEqualTo(3);
        assertThat(r.answeredSlots()).isEqualTo(1);
    }

    @Test
    void skippingMarksTheSlotAndAnAnsweredSlotCannotBeSkipped() {
        PracticeSession s = session(SessionType.FAST, 3, 1, 0);
        List<SessionQuestion> list = slots(s, 3, 1);
        when(attemptRepository.findBySessionIdOrderByAnsweredAtAsc(s.getId())).thenReturn(List.of());

        service.skipSlot(user, s.getId(), 2);
        assertThat(list.get(1).isSkipped()).isTrue();

        assertThatThrownBy(() -> service.skipSlot(user, s.getId(), 1)).isInstanceOf(BadRequestException.class);
    }

    @Test
    void slotOptionsKeepTheSameOrderEveryTimeTheQuestionIsOpened() {
        PracticeSession s = session(SessionType.FAST, 3, 0, 0);
        slots(s, 3, 0);
        when(attemptRepository.findBySessionIdOrderByAnsweredAtAsc(s.getId())).thenReturn(List.of());

        SlotQuestionResponse first = service.getSlot(user, s.getId(), 2);
        SlotQuestionResponse second = service.getSlot(user, s.getId(), 2);

        assertThat(first.question().options()).containsExactlyElementsOf(second.question().options());
        assertThat(first.review()).isNull();
        assertThat(first.status()).isEqualTo("NOT_ATTEMPTED");
    }
}
