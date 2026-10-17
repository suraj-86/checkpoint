package com.checkpoint.progress.service;

import com.checkpoint.common.exception.NotFoundException;
import com.checkpoint.practice.entity.PracticeSession;
import com.checkpoint.practice.entity.QuestionAttempt;
import com.checkpoint.practice.entity.SessionQuestion;
import com.checkpoint.practice.entity.SessionStatus;
import com.checkpoint.practice.entity.SessionType;
import com.checkpoint.practice.repository.PracticeSessionRepository;
import com.checkpoint.practice.repository.QuestionAttemptRepository;
import com.checkpoint.practice.repository.SessionQuestionRepository;
import com.checkpoint.progress.dto.SessionDetailResponse;
import com.checkpoint.question.entity.Difficulty;
import com.checkpoint.question.entity.Question;
import com.checkpoint.question.entity.QuestionType;
import com.checkpoint.topic.entity.Topic;
import com.checkpoint.user.entity.Role;
import com.checkpoint.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.lenient;

@ExtendWith(MockitoExtension.class)
class SessionDetailServiceTest {

    @Mock
    private PracticeSessionRepository sessionRepository;
    @Mock
    private SessionQuestionRepository sessionQuestionRepository;
    @Mock
    private QuestionAttemptRepository attemptRepository;

    private SessionDetailService service;
    private User user;
    private Topic topic;

    @BeforeEach
    void setUp() {
        service = new SessionDetailService(sessionRepository, sessionQuestionRepository, attemptRepository);
        user = User.builder().id(UUID.randomUUID()).username("u").role(Role.STUDENT).build();
        topic = Topic.builder().id(UUID.randomUUID()).name("Java").build();
    }

    private Question question(String text) {
        return Question.builder()
                .id(UUID.randomUUID())
                .topic(topic)
                .questionType(QuestionType.MULTIPLE_CHOICE)
                .difficulty(Difficulty.EASY)
                .questionText(text)
                .answerData(Map.of("options", List.of("a", "b", "c", "d"), "correctAnswer", "a"))
                .explanation("because " + text)
                .build();
    }

    private PracticeSession session(SessionStatus status) {
        PracticeSession s = PracticeSession.builder()
                .id(UUID.randomUUID()).user(user).sessionType(SessionType.FAST)
                .status(status).primaryQuestionCount(3).build();
        lenient().when(sessionRepository.findById(s.getId())).thenReturn(Optional.of(s));
        return s;
    }

    private SessionQuestion slot(PracticeSession s, Question q, int pos, boolean primary) {
        return SessionQuestion.builder().session(s).question(q).queuePosition(pos).primary(primary).build();
    }

    private QuestionAttempt attempt(PracticeSession s, Question q, boolean primary, boolean correct, String value) {
        return QuestionAttempt.builder().session(s).question(q).user(user).primary(primary)
                .correct(correct).submittedAnswer(Map.of("value", value)).build();
    }

    @Test
    void marksEachPrimaryQuestionAndSkipsRequeuedCopies() {
        PracticeSession s = session(SessionStatus.COMPLETED);
        Question q1 = question("one");
        Question q2 = question("two");
        Question q3 = question("three");
        org.mockito.Mockito.when(sessionQuestionRepository.findBySessionIdOrderByQueuePositionAsc(s.getId()))
                .thenReturn(List.of(slot(s, q1, 0, true), slot(s, q2, 1, true), slot(s, q1, 2, false), slot(s, q3, 3, true)));
        org.mockito.Mockito.when(attemptRepository.findBySessionIdOrderByAnsweredAtAsc(s.getId()))
                .thenReturn(List.of(attempt(s, q1, true, false, "b"), attempt(s, q2, true, true, "a"),
                        attempt(s, q1, false, true, "a")));

        SessionDetailResponse detail = service.getDetail(user, s.getId());

        assertThat(detail.totalQuestions()).isEqualTo(3);
        assertThat(detail.unansweredCount()).isEqualTo(1);
        assertThat(detail.questions()).extracting(SessionDetailResponse.QuestionReview::status)
                .containsExactly("WRONG", "CORRECT", "UNANSWERED");
        assertThat(detail.questions().get(0).yourAnswer()).isEqualTo("b");
        assertThat(detail.questions().get(0).correctAnswer()).isEqualTo("a");
        // finished session: even the unanswered one shows its answer for revision
        assertThat(detail.questions().get(2).correctAnswer()).isEqualTo("a");
    }

    @Test
    void hidesAnswersOfUnansweredQuestionsWhileTheSessionIsStillRunning() {
        PracticeSession s = session(SessionStatus.IN_PROGRESS);
        Question q1 = question("one");
        Question q2 = question("two");
        org.mockito.Mockito.when(sessionQuestionRepository.findBySessionIdOrderByQueuePositionAsc(s.getId()))
                .thenReturn(List.of(slot(s, q1, 0, true), slot(s, q2, 1, true)));
        org.mockito.Mockito.when(attemptRepository.findBySessionIdOrderByAnsweredAtAsc(s.getId()))
                .thenReturn(List.of(attempt(s, q1, true, true, "a")));

        SessionDetailResponse detail = service.getDetail(user, s.getId());

        assertThat(detail.questions().get(0).correctAnswer()).isEqualTo("a");
        assertThat(detail.questions().get(1).status()).isEqualTo("UNANSWERED");
        assertThat(detail.questions().get(1).correctAnswer()).isNull();
        assertThat(detail.questions().get(1).explanation()).isNull();
    }

    @Test
    void anotherStudentsSessionIsNotFound() {
        PracticeSession s = session(SessionStatus.COMPLETED);
        User other = User.builder().id(UUID.randomUUID()).username("o").role(Role.STUDENT).build();

        assertThatThrownBy(() -> service.getDetail(other, s.getId())).isInstanceOf(NotFoundException.class);
    }
}
