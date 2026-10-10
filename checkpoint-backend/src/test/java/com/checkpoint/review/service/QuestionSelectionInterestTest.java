package com.checkpoint.review.service;

import com.checkpoint.question.entity.Question;
import com.checkpoint.review.entity.UserQuestionProgress;
import com.checkpoint.review.repository.UserQuestionProgressRepository;
import com.checkpoint.topic.entity.Topic;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class QuestionSelectionInterestTest {

    @Mock
    private UserQuestionProgressRepository progressRepository;

    private QuestionSelectionService service;
    private final UUID userId = UUID.randomUUID();
    private final Instant now = Instant.parse("2026-10-09T10:00:00Z");

    private final Topic java = Topic.builder().id(UUID.randomUUID()).name("Java").build();
    private final Topic sql = Topic.builder().id(UUID.randomUUID()).name("SQL").build();

    @BeforeEach
    void setUp() {
        service = new QuestionSelectionService(progressRepository);
        lenient().when(progressRepository.findNeedsReview(any())).thenReturn(List.of());
        lenient().when(progressRepository.findOverdue(any(), any())).thenReturn(List.of());
        lenient().when(progressRepository.findDueToday(any(), any(), any())).thenReturn(List.of());
        lenient().when(progressRepository.findNeverAttempted(any())).thenReturn(List.of());
    }

    private Question question(String label, Topic topic) {
        return Question.builder().id(UUID.randomUUID()).questionText(label).topic(topic).build();
    }

    private List<String> labels(QuestionSelectionService.SelectionResult result) {
        return result.questions().stream().map(Question::getQuestionText).toList();
    }

    @Test
    void newQuestionsAreLimitedToTheStudentsInterestTopics() {
        when(progressRepository.findNeverAttempted(userId)).thenReturn(List.of(
                question("j1", java), question("j2", java), question("s1", sql), question("s2", sql)));

        var result = service.selectForSession(userId, 10, now, Set.of(sql.getId()));

        assertThat(labels(result)).containsExactlyInAnyOrder("s1", "s2");
    }

    @Test
    void reviewQuestionsAreLimitedToTheStudentsInterestTopics() {
        Question javaQuestion = question("j1", java);
        Question sqlQuestion = question("s1", sql);
        when(progressRepository.findNeedsReview(userId)).thenReturn(List.of(
                UserQuestionProgress.builder().question(javaQuestion).build(),
                UserQuestionProgress.builder().question(sqlQuestion).build()));

        var result = service.selectForSession(userId, 10, now, Set.of(java.getId()));

        assertThat(labels(result)).containsExactly("j1");
    }

    @Test
    void fallsBackToAllTopicsWhenNothingMatchesTheInterests() {
        when(progressRepository.findNeverAttempted(userId)).thenReturn(List.of(
                question("j1", java), question("s1", sql)));

        var result = service.selectForSession(userId, 10, now, Set.of(UUID.randomUUID()));

        assertThat(labels(result)).containsExactlyInAnyOrder("j1", "s1");
    }

    @Test
    void emptyInterestsMeansAllTopics() {
        when(progressRepository.findNeverAttempted(userId)).thenReturn(List.of(
                question("j1", java), question("s1", sql)));

        var result = service.selectForSession(userId, 10, now, Set.of());

        assertThat(labels(result)).containsExactlyInAnyOrder("j1", "s1");
    }

    @Test
    void newQuestionsFromSeveralTopicsAreMixedInsteadOfOneTopicFirst() {
        when(progressRepository.findNeverAttempted(userId)).thenReturn(List.of(
                question("j1", java), question("j2", java), question("j3", java),
                question("s1", sql), question("s2", sql), question("s3", sql)));

        var result = service.selectForSession(userId, 4, now);

        assertThat(labels(result)).containsExactly("j1", "s1", "j2", "s2");
    }
}
