package com.checkpoint.practice.entity;

import com.checkpoint.question.entity.Question;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "session_questions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SessionQuestion {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private PracticeSession session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(name = "queue_position", nullable = false)
    private int queuePosition;

    @Column(name = "is_primary", nullable = false)
    private boolean primary;

    @Column(nullable = false)
    @Builder.Default
    private boolean answered = false;
}
