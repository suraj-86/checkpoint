package com.checkpoint.practice.service;

import com.checkpoint.question.entity.QuestionType;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class AnswerEvaluatorTest {

    private final AnswerEvaluator evaluator = new AnswerEvaluator();

    @Nested
    class MultipleChoice {

        private final Map<String, Object> data = Map.of(
                "options", List.of("extends", "implements", "inherits", "super"),
                "correctAnswer", "extends"
        );

        @Test
        void exactMatchIsCorrect() {
            var result = evaluator.evaluate(QuestionType.MULTIPLE_CHOICE, data, "extends");
            assertThat(result.correct()).isTrue();
            assertThat(result.correctAnswer()).isEqualTo("extends");
        }

        @Test
        void wrongOptionIsIncorrect() {
            var result = evaluator.evaluate(QuestionType.MULTIPLE_CHOICE, data, "implements");
            assertThat(result.correct()).isFalse();
        }

        @Test
        void surroundingWhitespaceIsTrimmed() {
            var result = evaluator.evaluate(QuestionType.MULTIPLE_CHOICE, data, "  extends  ");
            assertThat(result.correct()).isTrue();
        }

        @Test
        void caseIsNotNormalizedForMcq_unlikeFillInBlank() {
            var result = evaluator.evaluate(QuestionType.MULTIPLE_CHOICE, data, "Extends");
            assertThat(result.correct()).isFalse();
        }

        @Test
        void wrongTypeSubmissionIsIncorrectNotAnError() {
            var result = evaluator.evaluate(QuestionType.MULTIPLE_CHOICE, data, true);
            assertThat(result.correct()).isFalse();
        }
    }

    @Nested
    class TrueFalse {

        @Test
        void matchingBooleanIsCorrect() {
            var data = Map.<String, Object>of("correctAnswer", true);
            var result = evaluator.evaluate(QuestionType.TRUE_FALSE, data, true);
            assertThat(result.correct()).isTrue();
        }

        @Test
        void mismatchedBooleanIsIncorrect() {
            var data = Map.<String, Object>of("correctAnswer", false);
            var result = evaluator.evaluate(QuestionType.TRUE_FALSE, data, true);
            assertThat(result.correct()).isFalse();
        }

        @Test
        void aStringInsteadOfBooleanIsIncorrectNotAnError() {
            var data = Map.<String, Object>of("correctAnswer", true);
            var result = evaluator.evaluate(QuestionType.TRUE_FALSE, data, "true");
            assertThat(result.correct()).isFalse();
        }
    }

    @Nested
    class FillInBlank {

        private final Map<String, Object> data = Map.of(
                "acceptedAnswers", List.of("equals", ".equals", "equals()")
        );

        @Test
        void exactMatchIsCorrect() {
            var result = evaluator.evaluate(QuestionType.FILL_IN_BLANK, data, "equals");
            assertThat(result.correct()).isTrue();
        }

        @Test
        void caseIsNormalized() {
            var result = evaluator.evaluate(QuestionType.FILL_IN_BLANK, data, "EQUALS");
            assertThat(result.correct()).isTrue();
        }

        @Test
        void surroundingAndInternalWhitespaceIsNormalized() {
            var dataWithSpaces = Map.<String, Object>of("acceptedAnswers", List.of("is a"));
            var result = evaluator.evaluate(QuestionType.FILL_IN_BLANK, dataWithSpaces, "  is   a  ");
            assertThat(result.correct()).isTrue();
        }

        @Test
        void anyOneOfMultipleAcceptedAnswersMatches() {
            var result = evaluator.evaluate(QuestionType.FILL_IN_BLANK, data, ".equals");
            assertThat(result.correct()).isTrue();
        }

        @Test
        void unrelatedTextIsIncorrect() {
            var result = evaluator.evaluate(QuestionType.FILL_IN_BLANK, data, "toString");
            assertThat(result.correct()).isFalse();
        }
    }
}
