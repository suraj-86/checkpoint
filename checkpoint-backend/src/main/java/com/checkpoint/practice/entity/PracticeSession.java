package com.checkpoint.practice.entity;

import com.checkpoint.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "practice_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PracticeSession {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "session_type", nullable = false, length = 10)
    private SessionType sessionType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private SessionStatus status = SessionStatus.IN_PROGRESS;

    /** How many DISTINCT questions this session was built with (excludes requeues). */
    @Column(name = "primary_question_count", nullable = false)
    private int primaryQuestionCount;

    @Column(name = "attempt_count", nullable = false)
    @Builder.Default
    private int attemptCount = 0;

    @Column(name = "correct_count", nullable = false)
    @Builder.Default
    private int correctCount = 0;

    @Column(name = "wrong_count", nullable = false)
    @Builder.Default
    private int wrongCount = 0;

    /** Percentage across PRIMARY attempts only, set once on completion — see docs section 10. */
    @Column(precision = 5, scale = 2)
    private BigDecimal accuracy;

    /** Set by Phase 6 (XP engine). Null until then / until completion. */
    @Column(name = "xp_change")
    private Integer xpChange;

    @Column(name = "started_at", nullable = false, updatable = false)
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @PrePersist
    protected void onCreate() {
        if (startedAt == null) {
            startedAt = Instant.now();
        }
    }
}
