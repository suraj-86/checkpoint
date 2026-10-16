package com.checkpoint.account.service;

import com.checkpoint.account.dto.AccountResponse;
import com.checkpoint.account.dto.ChangePasswordRequest;
import com.checkpoint.account.dto.UpdateProfileRequest;
import com.checkpoint.common.exception.BadRequestException;
import com.checkpoint.common.exception.ConflictException;
import com.checkpoint.user.entity.Role;
import com.checkpoint.user.entity.User;
import com.checkpoint.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

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
class AccountServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private static final Clock CLOCK = Clock.fixed(Instant.parse("2026-10-16T10:00:00Z"), ZoneOffset.UTC);

    private AccountService service;
    private User user;

    @BeforeEach
    void setUp() {
        service = new AccountService(userRepository, passwordEncoder, CLOCK, 7);
        user = User.builder()
                .id(UUID.randomUUID())
                .username("student")
                .email("old@example.com")
                .passwordHash("old-hash")
                .role(Role.STUDENT)
                .build();
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
    }

    private UpdateProfileRequest profile(String displayName, String email, String bio, String goal, String color) {
        return new UpdateProfileRequest(null, displayName, email, bio, goal, color);
    }

    private UpdateProfileRequest withUsername(String username) {
        return new UpdateProfileRequest(username, null, "old@example.com", null, null, null);
    }

    @Test
    void updateProfileSavesTrimmedValuesAndTurnsBlanksIntoNull() {
        when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        AccountResponse response = service.updateProfile(
                user.getId(), profile("  Suraj K  ", " new@example.com ", "   ", "Placements", "indigo"));

        assertThat(response.email()).isEqualTo("new@example.com");
        assertThat(response.displayName()).isEqualTo("Suraj K");
        assertThat(response.bio()).isNull();
        assertThat(response.goal()).isEqualTo("Placements");
        assertThat(response.avatarColor()).isEqualTo("indigo");
    }

    @Test
    void updateProfileRejectsAnEmailThatBelongsToAnotherAccount() {
        when(userRepository.existsByEmail("taken@example.com")).thenReturn(true);

        assertThatThrownBy(() -> service.updateProfile(
                user.getId(), profile(null, "taken@example.com", null, null, null)))
                .isInstanceOf(ConflictException.class);

        verify(userRepository, never()).save(any());
    }

    @Test
    void updateProfileDoesNotCheckUniquenessWhenTheEmailIsUnchanged() {
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        service.updateProfile(user.getId(), profile("Name", "old@example.com", null, null, null));

        verify(userRepository, never()).existsByEmail(any());
    }

    @Test
    void updateProfileRejectsUnknownAvatarColors() {
        assertThatThrownBy(() -> service.updateProfile(
                user.getId(), profile(null, "old@example.com", null, null, "hotpink")))
                .isInstanceOf(BadRequestException.class);

        verify(userRepository, never()).save(any());
    }

    @Test
    void changePasswordRejectsAWrongCurrentPassword() {
        when(passwordEncoder.matches("wrong", "old-hash")).thenReturn(false);

        assertThatThrownBy(() -> service.changePassword(user.getId(), new ChangePasswordRequest("wrong", "brand-new-pass")))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("incorrect");

        verify(userRepository, never()).save(any());
    }

    @Test
    void changePasswordRejectsReusingTheCurrentPassword() {
        when(passwordEncoder.matches("same-pass-1", "old-hash")).thenReturn(true);

        assertThatThrownBy(() -> service.changePassword(user.getId(), new ChangePasswordRequest("same-pass-1", "same-pass-1")))
                .isInstanceOf(BadRequestException.class);

        verify(userRepository, never()).save(any());
    }

    @Test
    void changePasswordStoresTheEncodedNewPassword() {
        when(passwordEncoder.matches("current-pass", "old-hash")).thenReturn(true);
        when(passwordEncoder.matches("brand-new-pass", "old-hash")).thenReturn(false);
        when(passwordEncoder.encode("brand-new-pass")).thenReturn("new-hash");

        service.changePassword(user.getId(), new ChangePasswordRequest("current-pass", "brand-new-pass"));

        assertThat(user.getPasswordHash()).isEqualTo("new-hash");
        verify(userRepository).save(user);
    }

    @Test
    void usernameIsChangedAndTheChangeTimeRecorded() {
        when(userRepository.existsByUsernameIgnoreCaseAndIdNot("new_name", user.getId())).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        AccountResponse response = service.updateProfile(user.getId(), withUsername("new_name"));

        assertThat(response.username()).isEqualTo("new_name");
        assertThat(user.getUsernameChangedAt()).isEqualTo(CLOCK.instant());
        assertThat(response.usernameChangeAvailableAt()).isEqualTo(CLOCK.instant().plusSeconds(7 * 86400L));
    }

    @Test
    void usernameTakenByAnotherAccountIsRejectedCaseInsensitively() {
        when(userRepository.existsByUsernameIgnoreCaseAndIdNot("Taken", user.getId())).thenReturn(true);

        assertThatThrownBy(() -> service.updateProfile(user.getId(), withUsername("Taken")))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("already taken");

        verify(userRepository, never()).save(any());
    }

    @Test
    void usernameWithSpacesIsRejected() {
        assertThatThrownBy(() -> service.updateProfile(user.getId(), withUsername("has space")))
                .isInstanceOf(BadRequestException.class);

        verify(userRepository, never()).save(any());
    }

    @Test
    void reservedUsernameIsRejected() {
        assertThatThrownBy(() -> service.updateProfile(user.getId(), withUsername("Admin")))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("reserved");
    }

    @Test
    void usernameCannotBeChangedAgainDuringTheCooldown() {
        user.setUsernameChangedAt(CLOCK.instant().minusSeconds(86400L));

        assertThatThrownBy(() -> service.updateProfile(user.getId(), withUsername("another_one")))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("again in");

        verify(userRepository, never()).save(any());
    }

    @Test
    void usernameCanBeChangedAfterTheCooldownHasPassed() {
        user.setUsernameChangedAt(CLOCK.instant().minusSeconds(8 * 86400L));
        when(userRepository.existsByUsernameIgnoreCaseAndIdNot("another_one", user.getId())).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        AccountResponse response = service.updateProfile(user.getId(), withUsername("another_one"));

        assertThat(response.username()).isEqualTo("another_one");
    }

    @Test
    void adminUsernameCannotBeChanged() {
        user.setRole(Role.ADMIN);

        assertThatThrownBy(() -> service.updateProfile(user.getId(), withUsername("boss_man")))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void unchangedUsernameSkipsAllUsernameChecks() {
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        service.updateProfile(user.getId(), withUsername("student"));

        verify(userRepository, never()).existsByUsernameIgnoreCaseAndIdNot(any(), any());
        assertThat(user.getUsernameChangedAt()).isNull();
    }
}
