package com.checkpoint.settings.service;

import com.checkpoint.common.exception.BadRequestException;
import com.checkpoint.settings.dto.SettingsRequest;
import com.checkpoint.settings.dto.SettingsResponse;
import com.checkpoint.settings.entity.Theme;
import com.checkpoint.settings.entity.UserSettings;
import com.checkpoint.settings.repository.UserSettingsRepository;
import com.checkpoint.user.entity.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.util.UUID;

@Service
public class SettingsService {

    public static final int DEFAULT_DAILY_SESSION_SIZE = 10;
    public static final int MIN_DAILY_SESSION_SIZE = 5;
    public static final int MAX_DAILY_SESSION_SIZE = 20;
    public static final int DEFAULT_DAILY_FOCUS_MINUTES = 120;
    public static final int MIN_DAILY_FOCUS_MINUTES = 15;
    public static final int MAX_DAILY_FOCUS_MINUTES = 720;

    private final UserSettingsRepository repository;
    private final Clock clock;

    public SettingsService(UserSettingsRepository repository, Clock clock) {
        this.repository = repository;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public SettingsResponse get(User user) {
        return repository.findById(user.getId()).map(SettingsService::toResponse)
                .orElseGet(() -> new SettingsResponse(null, false, DEFAULT_DAILY_SESSION_SIZE, DEFAULT_DAILY_FOCUS_MINUTES));
    }

    @Transactional
    public SettingsResponse update(User user, SettingsRequest request) {
        UserSettings settings = repository.findById(user.getId())
                .orElseGet(() -> UserSettings.builder().userId(user.getId()).build());

        if (request.theme() != null) {
            settings.setTheme(parseTheme(request.theme()));
        }
        if (request.soundEnabled() != null) {
            settings.setSoundEnabled(request.soundEnabled());
        }
        if (request.dailySessionSize() != null) {
            int size = request.dailySessionSize();
            if (size < MIN_DAILY_SESSION_SIZE || size > MAX_DAILY_SESSION_SIZE) {
                throw new BadRequestException("Daily session size must be between "
                        + MIN_DAILY_SESSION_SIZE + " and " + MAX_DAILY_SESSION_SIZE + ".");
            }
            settings.setDailySessionSize(size);
        }
        if (request.dailyFocusMinutes() != null) {
            int minutes = request.dailyFocusMinutes();
            if (minutes < MIN_DAILY_FOCUS_MINUTES || minutes > MAX_DAILY_FOCUS_MINUTES) {
                throw new BadRequestException("Daily focus target must be between "
                        + MIN_DAILY_FOCUS_MINUTES + " and " + MAX_DAILY_FOCUS_MINUTES + " minutes.");
            }
            settings.setDailyFocusMinutes(minutes);
        }
        settings.setUpdatedAt(Instant.now(clock));
        return toResponse(repository.save(settings));
    }

    /** The student's chosen Daily Session size, or the default when they have not set one. */
    @Transactional(readOnly = true)
    public int dailySessionSize(UUID userId) {
        return repository.findById(userId).map(UserSettings::getDailySessionSize)
                .orElse(DEFAULT_DAILY_SESSION_SIZE);
    }

    /** The student's daily Focus target in minutes, or the default when they have not set one. */
    @Transactional(readOnly = true)
    public int dailyFocusMinutes(UUID userId) {
        return repository.findById(userId).map(UserSettings::getDailyFocusMinutes)
                .orElse(DEFAULT_DAILY_FOCUS_MINUTES);
    }

    private static Theme parseTheme(String value) {
        try {
            return Theme.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Theme must be MORNING, DAWN or NIGHT.");
        }
    }

    private static SettingsResponse toResponse(UserSettings s) {
        return new SettingsResponse(s.getTheme() == null ? null : s.getTheme().name(), s.isSoundEnabled(), s.getDailySessionSize(),
                s.getDailyFocusMinutes());
    }
}
