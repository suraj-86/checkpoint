package com.checkpoint.focus.entity;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDate;
import java.util.UUID;

/** Composite key of focus_days. */
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class FocusDayId implements Serializable {

    private UUID userId;
    private LocalDate day;
}
