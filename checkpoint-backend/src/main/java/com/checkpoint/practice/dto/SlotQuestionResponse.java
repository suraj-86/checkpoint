package com.checkpoint.practice.dto;

public record SlotQuestionResponse(
        int position,
        String status,
        boolean primary,
        StudentQuestionResponse question,
        Review review
) {
    public record Review(boolean correct, Object yourAnswer, Object correctAnswer, String explanation) {
    }
}
