package com.checkpoint.review.service;

import com.checkpoint.question.entity.Question;
import com.checkpoint.review.entity.UserQuestionProgress;
import com.checkpoint.review.repository.UserQuestionProgressRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class QuestionSelectionServiceTest {

    @Mock
    private UserQuestionProgressRepository progressRepository;

    private QuestionSelectionService service;
    private final UUID userId = UUID.randomUUID();
    private final Instant now = Instant.parse("2026-09-28T10:00:00Z");

    @BeforeEach
    void setUp() {
        service = new QuestionSelectionService(progressRepository);
        lenient().when(progressRepository.findNeedsReview(any())).thenReturn(List.of());
        lenient().when(progressRepository.findOverdue(any(), any())).thenReturn(List.of());
        lenient().when(progressRepository.findDueToday(any(), any(), any())).thenReturn(List.of());
        lenient().when(progressRepository.findNeverAttempted(any())).thenReturn(List.of());
    }

    private Question question(String label) {
        return Question.builder().id(UUID.randomUUID()).questionText(label).build();
    }

    private UserQuestionProgress progressFor(Question q) {
        return UserQuestionProgress.builder().question(q).build();
    }

    @Test
    void withNoDataAtAll_returnsAnEmptyList() {
        var result = service.selectForSession(userId, 10, now);
        assertThat(result.questions()).isEmpty();
    }

    @Test
    void extremeBacklog_fillsEntirelyFromReviewAndReservesZeroForNew() {
        List<Question> needsReviewQuestions = List.of(question("nr1"), question("nr2"), question("nr3"),
                question("nr4"), question("nr5"), question("nr6"));
        when(progressRepository.findNeedsReview(userId))
                .thenReturn(needsReviewQuestions.stream().map(this::progressFor).toList());
        when(progressRepository.findNeverAttempted(userId))
                .thenReturn(List.of(question("new1"), question("new2"), question("new3")));

        var result = service.selectForSession(userId, 5, now);

        assertThat(result.questions()).hasSize(5);
        assertThat(result.questions()).allMatch(q -> needsReviewQuestions.contains(q));
    }

    @Test
    void lightBacklog_reservesRoughlyThirtyPercentForNewQuestions() {
        Question onlyReviewQuestion = question("nr1");
        when(progressRepository.findNeedsReview(userId))
                .thenReturn(List.of(progressFor(onlyReviewQuestion)));

        List<Question> newQuestions = List.of(question("n1"), question("n2"), question("n3"),
                question("n4"), question("n5"), question("n6"), question("n7"), question("n8"),
                question("n9"), question("n10"));
        when(progressRepository.findNeverAttempted(userId)).thenReturn(newQuestions);

        var result = service.selectForSession(userId, 5, now);

        assertThat(result.questions()).hasSize(5);
        assertThat(result.questions()).contains(onlyReviewQuestion);
        long newCount = result.questions().stream().filter(newQuestions::contains).count();
        assertThat(newCount).isEqualTo(4);
    }

    @Test
    void priorityOrder_needsReviewBeforeOverdueBeforeDueToday() {
        Question nr = question("needs-review");
        Question overdueQ = question("overdue");
        Question dueQ = question("due-today");

        when(progressRepository.findNeedsReview(userId)).thenReturn(List.of(progressFor(nr)));
        when(progressRepository.findOverdue(any(), any())).thenReturn(List.of(progressFor(overdueQ)));
        when(progressRepository.findDueToday(any(), any(), any())).thenReturn(List.of(progressFor(dueQ)));

        var result = service.selectForSession(userId, 3, now);

        assertThat(result.questions()).containsExactly(nr, overdueQ, dueQ);
    }

    @Test
    void onlyNewQuestionsAvailable_fillsSessionEntirelyFromNew() {
        List<Question> newQuestions = List.of(question("n1"), question("n2"), question("n3"));
        when(progressRepository.findNeverAttempted(userId)).thenReturn(newQuestions);

        var result = service.selectForSession(userId, 3, now);

        assertThat(result.questions()).containsExactlyInAnyOrderElementsOf(newQuestions);
    }

    @Test
    void requestingMoreThanAvailable_returnsWhateverExists_withoutError() {
        when(progressRepository.findNeverAttempted(userId)).thenReturn(List.of(question("only-one")));

        var result = service.selectForSession(userId, 20, now);

        assertThat(result.questions()).hasSize(1);
    }
}
