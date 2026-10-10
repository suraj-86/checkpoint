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

    private AccountService service;
    private User user;

    @BeforeEach
    void setUp() {
        service = new AccountService(userRepository, passwordEncoder);
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
        return new UpdateProfileRequest(displayName, email, bio, goal, color);
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
}
