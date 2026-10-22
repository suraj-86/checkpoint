package com.checkpoint.focus.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.UUID;

/** Focus time recorded for one student on one day. */
@Entity
@Table(name = "focus_days")
@IdClass(FocusDayId.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FocusDay {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @Id
    @Column(name = "day")
    private LocalDate day;

    @Column(nullable = false)
    private int seconds;

    @Column(name = "target_minutes", nullable = false)
    private int targetMinutes;

    @Column(nullable = false)
    private boolean rewarded;
}
