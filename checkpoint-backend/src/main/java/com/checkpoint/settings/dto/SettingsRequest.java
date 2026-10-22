package com.checkpoint.settings.dto;

/** Partial update: a null field is left unchanged. */
public record SettingsRequest(String theme, Boolean soundEnabled, Integer dailySessionSize, Integer dailyFocusMinutes) {

    /** Compatibility constructor for callers that do not touch the focus target. */
    public SettingsRequest(String theme, Boolean soundEnabled, Integer dailySessionSize) {
        this(theme, soundEnabled, dailySessionSize, null);
    }
}
