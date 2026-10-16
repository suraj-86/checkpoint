package com.checkpoint.account.service;

import com.checkpoint.account.dto.AccountResponse;
import com.checkpoint.account.dto.ChangePasswordRequest;
import com.checkpoint.account.dto.UpdateProfileRequest;
import com.checkpoint.common.exception.BadRequestException;
import com.checkpoint.common.exception.ConflictException;
import com.checkpoint.common.exception.NotFoundException;
import com.checkpoint.user.entity.Role;
import com.checkpoint.user.entity.User;
import com.checkpoint.user.repository.UserRepository;
import com.checkpoint.user.rules.UsernameRules;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
public class AccountService {

    static final Set<String> AVATAR_COLORS =
            Set.of("indigo", "sky", "emerald", "amber", "rose", "violet", "slate", "blue");

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final Clock clock;
    private final long usernameCooldownDays;

    public AccountService(UserRepository userRepository, PasswordEncoder passwordEncoder, Clock clock,
                          @Value("${checkpoint.account.username-change-cooldown-days:7}") long usernameCooldownDays) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.clock = clock;
        this.usernameCooldownDays = usernameCooldownDays;
    }

    @Transactional(readOnly = true)
    public AccountResponse get(UUID userId) {
        User user = load(userId);
        return AccountResponse.from(user, nextUsernameChange(user).orElse(null));
    }

    @Transactional
    public AccountResponse updateProfile(UUID userId, UpdateProfileRequest request) {
        User user = load(userId);

        String email = request.email().trim();
        if (!email.equals(user.getEmail()) && userRepository.existsByEmail(email)) {
            throw new ConflictException("EMAIL_TAKEN", "That email is already registered.");
        }

        String avatarColor = blankToNull(request.avatarColor());
        if (avatarColor != null && !AVATAR_COLORS.contains(avatarColor)) {
            throw new BadRequestException("Unknown avatar color.");
        }

        applyUsernameChange(user, request.username());

        user.setEmail(email);
        user.setDisplayName(blankToNull(request.displayName()));
        user.setBio(blankToNull(request.bio()));
        user.setGoal(blankToNull(request.goal()));
        user.setAvatarColor(avatarColor);

        User saved = userRepository.save(user);
        try {
            userRepository.flush();
        } catch (DataIntegrityViolationException ex) {
            throw new ConflictException("USERNAME_TAKEN", "That username is already taken.");
        }
        return AccountResponse.from(saved, nextUsernameChange(saved).orElse(null));
    }

    private void applyUsernameChange(User user, String requested) {
        if (requested == null || requested.equals(user.getUsername())) {
            return;
        }
        if (user.getRole() == Role.ADMIN) {
            throw new BadRequestException("The admin username cannot be changed.");
        }
        UsernameRules.check(requested).ifPresent(v -> {
            throw new BadRequestException(v.message());
        });

        Optional<Instant> availableAt = nextUsernameChange(user);
        if (availableAt.isPresent()) {
            long days = Math.max(1, Duration.between(clock.instant(), availableAt.get()).toDays() + 1);
            throw new ConflictException("USERNAME_COOLDOWN",
                    "You can change your username again in " + days + (days == 1 ? " day." : " days."));
        }

        boolean onlyCaseChanged = requested.equalsIgnoreCase(user.getUsername());
        if (!onlyCaseChanged && userRepository.existsByUsernameIgnoreCaseAndIdNot(requested, user.getId())) {
            throw new ConflictException("USERNAME_TAKEN", "That username is already taken.");
        }

        user.setUsername(requested);
        user.setUsernameChangedAt(clock.instant());
    }

    /** When the user may next change their username, if that is still in the future. */
    private Optional<Instant> nextUsernameChange(User user) {
        if (usernameCooldownDays <= 0 || user.getUsernameChangedAt() == null) {
            return Optional.empty();
        }
        Instant next = user.getUsernameChangedAt().plus(Duration.ofDays(usernameCooldownDays));
        return next.isAfter(clock.instant()) ? Optional.of(next) : Optional.empty();
    }

    @Transactional
    public void changePassword(UUID userId, ChangePasswordRequest request) {
        User user = load(userId);

        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Current password is incorrect.");
        }
        if (passwordEncoder.matches(request.newPassword(), user.getPasswordHash())) {
            throw new BadRequestException("The new password must be different from the current one.");
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    private User load(UUID userId) {
        return userRepository.findById(userId).orElseThrow(() -> new NotFoundException("User not found."));
    }

    private static String blankToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
