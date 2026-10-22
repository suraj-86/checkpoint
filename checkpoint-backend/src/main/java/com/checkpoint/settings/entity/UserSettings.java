package com.checkpoint.settings.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSettings {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    /** Null until the user picks one, so the browser setting can decide meanwhile. */
    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    private Theme theme;

    @Column(name = "sound_enabled", nullable = false)
    @Builder.Default
    private boolean soundEnabled = false;

    @Column(name = "daily_session_size", nullable = false)
    @Builder.Default
    private int dailySessionSize = 10;

    @Column(name = "daily_focus_minutes", nullable = false)
    @Builder.Default
    private int dailyFocusMinutes = 120;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
