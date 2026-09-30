package com.checkpoint.practice.service;

import com.checkpoint.question.entity.QuestionType;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class AnswerEvaluator {

    public record Result(boolean correct, Object correctAnswer) {
    }

    public Result evaluate(QuestionType type, Map<String, Object> answerData, Object submitted) {
        return switch (type) {
            case MULTIPLE_CHOICE -> evaluateMultipleChoice(answerData, submitted);
            case TRUE_FALSE -> evaluateTrueFalse(answerData, submitted);
            case FILL_IN_BLANK -> evaluateFillInBlank(answerData, submitted);
        };
    }

    private Result evaluateMultipleChoice(Map<String, Object> answerData, Object submitted) {
        Object correctAnswer = answerData.get("correctAnswer");
        boolean correct = submitted instanceof String submittedText
                && correctAnswer instanceof String correctText
                && submittedText.trim().equals(correctText.trim());
        return new Result(correct, correctAnswer);
    }

    private Result evaluateTrueFalse(Map<String, Object> answerData, Object submitted) {
        Object correctAnswer = answerData.get("correctAnswer");
        boolean correct = submitted instanceof Boolean submittedBool
                && correctAnswer instanceof Boolean correctBool
                && submittedBool.equals(correctBool);
        return new Result(correct, correctAnswer);
    }

    private Result evaluateFillInBlank(Map<String, Object> answerData, Object submitted) {
        Object acceptedRaw = answerData.get("acceptedAnswers");
        List<?> accepted = acceptedRaw instanceof List<?> list ? list : List.of();

        boolean correct = submitted instanceof String submittedText && accepted.stream()
                .anyMatch(a -> a instanceof String acceptedText && normalize(acceptedText).equals(normalize(submittedText)));

        return new Result(correct, accepted);
    }

    private String normalize(String s) {
        return s.trim().toLowerCase().replaceAll("\\s+", " ");
    }
}
