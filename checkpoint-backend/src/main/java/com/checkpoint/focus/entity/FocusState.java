package com.checkpoint.focus.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/** The last heartbeat of a running focus timer. No row means the timer is not running. */
@Entity
@Table(name = "focus_state")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FocusState {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "last_tick_at", nullable = false)
    private Instant lastTickAt;
}
