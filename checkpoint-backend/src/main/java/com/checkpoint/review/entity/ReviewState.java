package com.checkpoint.review.entity;

/**
 * Per docs/08-Review-Learning-Algorithm.md section 2.
 *
 * NEW is deliberately never persisted by this codebase: a question with no
 * progress row at all IS the NEW state (no row = never answered). A row is
 * only created the moment a student first answers a question. The enum
 * value still exists for documentation completeness and in case a future
 * phase needs to represent it explicitly.
 *
 * DUE is computed at selection time (a STABLE question whose nextReviewAt
 * has arrived), not written back to the row proactively — see
 * QuestionSelectionService.
 */
public enum ReviewState {
    NEW,
    DUE,
    NEEDS_REVIEW,
    STABLE
}
