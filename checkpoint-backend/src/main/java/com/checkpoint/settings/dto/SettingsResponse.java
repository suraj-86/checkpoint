package com.checkpoint.settings.dto;

/**
 * theme is MORNING, DAWN, NIGHT, or null when the user has not chosen yet.
 * dailySessionSize is how many questions a Daily Session holds (5 to 20).
 * dailyFocusMinutes is the daily Focus target (15 to 720).
 */
public record SettingsResponse(String theme, boolean soundEnabled, int dailySessionSize, int dailyFocusMinutes) {

    /** Compatibility constructor: the focus target falls back to the default. */
    public SettingsResponse(String theme, boolean soundEnabled, int dailySessionSize) {
        this(theme, soundEnabled, dailySessionSize, 120);
    }
}
