package com.checkpoint.progress.service;

import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ProgressServiceActivityDateTest {

    private static final LocalDate DAY = LocalDate.of(2026, 10, 5);

    @Test
    void acceptsLocalDate() {
        assertThat(ProgressService.toLocalDate(DAY)).isEqualTo(DAY);
    }

    @Test
    void acceptsSqlDate() {
        assertThat(ProgressService.toLocalDate(java.sql.Date.valueOf(DAY))).isEqualTo(DAY);
    }

    @Test
    void acceptsInstantAsUtcDay() {
        assertThat(ProgressService.toLocalDate(Instant.parse("2026-10-05T00:00:00Z"))).isEqualTo(DAY);
        assertThat(ProgressService.toLocalDate(Instant.parse("2026-10-05T23:59:59Z"))).isEqualTo(DAY);
    }

    @Test
    void acceptsSqlTimestampAsUtcDay() {
        assertThat(ProgressService.toLocalDate(java.sql.Timestamp.from(Instant.parse("2026-10-05T12:00:00Z"))))
                .isEqualTo(DAY);
    }

    @Test
    void convertsOffsetDateTimeToUtcDay() {
        OffsetDateTime istMidnight = OffsetDateTime.of(2026, 10, 6, 1, 0, 0, 0, ZoneOffset.ofHoursMinutes(5, 30));
        assertThat(ProgressService.toLocalDate(istMidnight)).isEqualTo(DAY);
    }

    @Test
    void rejectsUnknownTypes() {
        assertThatThrownBy(() -> ProgressService.toLocalDate("2026-10-05"))
                .isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(() -> ProgressService.toLocalDate(null))
                .isInstanceOf(IllegalStateException.class);
    }
}
