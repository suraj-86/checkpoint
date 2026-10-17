package com.checkpoint.practice.entity;

import com.checkpoint.question.entity.Question;
import com.checkpoint.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "skipped_questions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SkippedQuestion {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(name = "skipped_at", nullable = false)
    private Instant skippedAt;
}
