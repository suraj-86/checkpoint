package com.checkpoint.progress.dto;

import java.time.LocalDate;

public record ActivityDayPoint(LocalDate date, long sessionCount, int xpTotal) {
}
