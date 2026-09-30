package com.checkpoint.review.session;

import com.checkpoint.question.entity.Question;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class SessionRequeueHelperTest {

    private Question question(String label) {
        return Question.builder().id(UUID.randomUUID()).questionText(label).build();
    }

    @Test
    void reinsertsAfterAtLeastTwoOtherQuestions_matchingTheQ5Q6Q7Q5Example() {
        Question q5 = question("Q5");
        Question q6 = question("Q6");
        Question q7 = question("Q7");
        List<Question> queue = new ArrayList<>(List.of(q5, q6, q7));

        SessionRequeueHelper helper = new SessionRequeueHelper();
        boolean requeued = helper.requeue(queue, 0, q5);

        assertThat(requeued).isTrue();
        assertThat(queue).containsExactly(q5, q6, q7, q5);
    }

    @Test
    void aQuestionCanOnlyBeRequeuedOnceInV1() {
        Question q1 = question("Q1");
        List<Question> queue = new ArrayList<>(List.of(q1));
        SessionRequeueHelper helper = new SessionRequeueHelper();

        boolean first = helper.requeue(queue, 0, q1);
        int sizeAfterFirst = queue.size();
        boolean second = helper.requeue(queue, 0, q1);

        assertThat(first).isTrue();
        assertThat(second).isFalse();
        assertThat(queue).hasSize(sizeAfterFirst);
        assertThat(helper.hasBeenRequeued(q1.getId())).isTrue();
    }

    @Test
    void insertionNeverGoesPastTheEndOfAShortQueue() {
        Question q1 = question("Q1");
        List<Question> queue = new ArrayList<>(List.of(q1));
        SessionRequeueHelper helper = new SessionRequeueHelper();

        boolean requeued = helper.requeue(queue, 0, q1);

        assertThat(requeued).isTrue();
        assertThat(queue).hasSize(2);
        assertThat(queue.get(1)).isEqualTo(q1);
    }

    @Test
    void differentQuestionsCanEachBeRequeuedIndependently() {
        Question q1 = question("Q1");
        Question q2 = question("Q2");
        List<Question> queue = new ArrayList<>(List.of(q1, q2));
        SessionRequeueHelper helper = new SessionRequeueHelper();

        boolean firstRequeued = helper.requeue(queue, 0, q1);
        boolean secondRequeued = helper.requeue(queue, 1, q2);

        assertThat(firstRequeued).isTrue();
        assertThat(secondRequeued).isTrue();
    }
}
