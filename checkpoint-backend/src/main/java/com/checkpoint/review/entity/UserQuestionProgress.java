package com.checkpoint.review.entity;

import com.checkpoint.question.entity.Question;
import com.checkpoint.user.entity.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_question_progress")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserQuestionProgress {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Enumerated(EnumType.STRING)
    @Column(name = "review_state", nullable = false, length = 20)
    @Builder.Default
    private ReviewState reviewState = ReviewState.NEW;

    @Column(name = "review_stage", nullable = false)
    @Builder.Default
    private short reviewStage = 1;

    @Column(name = "next_review_at")
    private Instant nextReviewAt;

    @Column(name = "times_seen", nullable = false)
    @Builder.Default
    private int timesSeen = 0;

    @Column(name = "times_correct", nullable = false)
    @Builder.Default
    private int timesCorrect = 0;

    @Column(name = "times_wrong", nullable = false)
    @Builder.Default
    private int timesWrong = 0;

    @Column(name = "consecutive_correct", nullable = false)
    @Builder.Default
    private int consecutiveCorrect = 0;

    @Column(name = "consecutive_wrong", nullable = false)
    @Builder.Default
    private int consecutiveWrong = 0;

    @Column(name = "last_answered_at")
    private Instant lastAnsweredAt;
}
