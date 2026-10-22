package com.checkpoint.settings.service;

import com.checkpoint.common.exception.BadRequestException;
import com.checkpoint.settings.dto.SettingsRequest;
import com.checkpoint.settings.dto.SettingsResponse;
import com.checkpoint.settings.entity.Theme;
import com.checkpoint.settings.entity.UserSettings;
import com.checkpoint.settings.repository.UserSettingsRepository;
import com.checkpoint.user.entity.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SettingsServiceTest {

    private static final Instant NOW = Instant.parse("2026-10-19T10:00:00Z");

    @Mock
    private UserSettingsRepository repository;

    private final User user = User.builder().id(UUID.randomUUID()).username("student").build();

    private SettingsService service() {
        return new SettingsService(repository, Clock.fixed(NOW, ZoneOffset.UTC));
    }

    @Test
    void newUserHasNoThemeChosenAndSoundOff() {
        when(repository.findById(user.getId())).thenReturn(Optional.empty());

        SettingsResponse response = service().get(user);

        assertThat(response.theme()).isNull();
        assertThat(response.soundEnabled()).isFalse();
        assertThat(response.dailySessionSize()).isEqualTo(10);
    }

    @Test
    void updateCreatesRowAndAcceptsThemeInAnyCase() {
        when(repository.findById(user.getId())).thenReturn(Optional.empty());
        when(repository.save(any(UserSettings.class))).thenAnswer(i -> i.getArgument(0));

        SettingsResponse response = service().update(user, new SettingsRequest("night", null, null));

        assertThat(response.theme()).isEqualTo("NIGHT");
        assertThat(response.soundEnabled()).isFalse();
    }

    @Test
    void nullFieldsAreLeftUnchanged() {
        UserSettings existing = UserSettings.builder()
                .userId(user.getId()).theme(Theme.DAWN).soundEnabled(false).updatedAt(NOW).build();
        when(repository.findById(user.getId())).thenReturn(Optional.of(existing));
        when(repository.save(any(UserSettings.class))).thenAnswer(i -> i.getArgument(0));

        SettingsResponse response = service().update(user, new SettingsRequest(null, true, null));

        assertThat(response.theme()).isEqualTo("DAWN");
        assertThat(response.soundEnabled()).isTrue();
    }

    @Test
    void unknownThemeIsRejected() {
        when(repository.findById(user.getId())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service().update(user, new SettingsRequest("neon", null, null)))
                .isInstanceOf(BadRequestException.class);
        verify(repository, never()).save(any());
    }

    @Test
    void dailySessionSizeIsSavedWithinRange() {
        when(repository.findById(user.getId())).thenReturn(Optional.empty());
        when(repository.save(any(UserSettings.class))).thenAnswer(i -> i.getArgument(0));

        SettingsResponse response = service().update(user, new SettingsRequest(null, null, 15));

        assertThat(response.dailySessionSize()).isEqualTo(15);
    }

    @Test
    void dailySessionSizeOutsideRangeIsRejected() {
        when(repository.findById(user.getId())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service().update(user, new SettingsRequest(null, null, 4)))
                .isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> service().update(user, new SettingsRequest(null, null, 21)))
                .isInstanceOf(BadRequestException.class);
        verify(repository, never()).save(any());
    }

    @Test
    void dailySessionSizeDefaultsWhenNoRow() {
        when(repository.findById(user.getId())).thenReturn(Optional.empty());

        assertThat(service().dailySessionSize(user.getId())).isEqualTo(10);
    }

    @Test
    void dailyFocusMinutesAreSavedWithinRange() {
        when(repository.findById(user.getId())).thenReturn(Optional.empty());
        when(repository.save(any(UserSettings.class))).thenAnswer(inv -> inv.getArgument(0));

        SettingsResponse response = service().update(user, new SettingsRequest(null, null, null, 300));

        assertThat(response.dailyFocusMinutes()).isEqualTo(300);
    }

    @Test
    void dailyFocusMinutesOutsideRangeAreRejected() {
        when(repository.findById(user.getId())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service().update(user, new SettingsRequest(null, null, null, 14)))
                .isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> service().update(user, new SettingsRequest(null, null, null, 721)))
                .isInstanceOf(BadRequestException.class);
        verify(repository, never()).save(any());
    }

    @Test
    void dailyFocusMinutesDefaultToTwoHoursWhenNoRow() {
        when(repository.findById(user.getId())).thenReturn(Optional.empty());

        assertThat(service().dailyFocusMinutes(user.getId())).isEqualTo(120);
    }
}
