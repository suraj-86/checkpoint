package com.checkpoint.question.util;

import com.checkpoint.question.entity.QuestionType;

public final class QuestionTypeCodec {

    private QuestionTypeCodec() {
    }

    public static QuestionType decode(String external) {
        return switch (external) {
            case "MCQ" -> QuestionType.MULTIPLE_CHOICE;
            case "TRUE_FALSE" -> QuestionType.TRUE_FALSE;
            case "FILL_IN_BLANK" -> QuestionType.FILL_IN_BLANK;
            default -> throw new IllegalArgumentException("Unknown question type: " + external);
        };
    }

    public static String encode(QuestionType internal) {
        return switch (internal) {
            case MULTIPLE_CHOICE -> "MCQ";
            case TRUE_FALSE -> "TRUE_FALSE";
            case FILL_IN_BLANK -> "FILL_IN_BLANK";
        };
    }

    public static boolean isValid(String external) {
        return switch (external) {
            case "MCQ", "TRUE_FALSE", "FILL_IN_BLANK" -> true;
            default -> false;
        };
    }
}
