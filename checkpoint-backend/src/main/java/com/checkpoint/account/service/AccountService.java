package com.checkpoint.account.service;

import com.checkpoint.account.dto.AccountResponse;
import com.checkpoint.account.dto.ChangePasswordRequest;
import com.checkpoint.account.dto.UpdateProfileRequest;
import com.checkpoint.common.exception.BadRequestException;
import com.checkpoint.common.exception.ConflictException;
import com.checkpoint.common.exception.NotFoundException;
import com.checkpoint.user.entity.User;
import com.checkpoint.user.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.UUID;

@Service
public class AccountService {

    static final Set<String> AVATAR_COLORS =
            Set.of("indigo", "sky", "emerald", "amber", "rose", "violet", "slate", "blue");

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AccountService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public AccountResponse get(UUID userId) {
        return AccountResponse.from(load(userId));
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

        user.setEmail(email);
        user.setDisplayName(blankToNull(request.displayName()));
        user.setBio(blankToNull(request.bio()));
        user.setGoal(blankToNull(request.goal()));
        user.setAvatarColor(avatarColor);

        return AccountResponse.from(userRepository.save(user));
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
