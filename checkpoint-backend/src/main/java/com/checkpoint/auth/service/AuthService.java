package com.checkpoint.auth.service;

import com.checkpoint.auth.dto.AuthResponse;
import com.checkpoint.auth.dto.LoginRequest;
import com.checkpoint.auth.dto.RegisterRequest;
import com.checkpoint.auth.dto.UserResponse;
import com.checkpoint.auth.security.JwtService;
import com.checkpoint.auth.security.LoginAttemptTracker;
import com.checkpoint.common.exception.AccountLockedException;
import com.checkpoint.common.exception.ConflictException;
import com.checkpoint.common.exception.InvalidCredentialsException;
import com.checkpoint.user.entity.Role;
import com.checkpoint.user.entity.User;
import com.checkpoint.user.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final LoginAttemptTracker loginAttemptTracker;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                        JwtService jwtService, LoginAttemptTracker loginAttemptTracker) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.loginAttemptTracker = loginAttemptTracker;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.username())) {
            throw new ConflictException("Username is already taken.");
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new ConflictException("Email is already registered.");
        }

        User user = User.builder()
                .username(request.username())
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .role(Role.STUDENT)
                .build();

        User saved = userRepository.save(user);

        String token = jwtService.generateToken(saved.getId(), saved.getUsername(), saved.getRole().name());
        return new AuthResponse(token, UserResponse.from(saved));
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        if (loginAttemptTracker.isLocked(request.username())) {
            throw new AccountLockedException();
        }

        User user = userRepository.findByUsername(request.username())
                .orElseGet(() -> {
                    loginAttemptTracker.recordFailure(request.username());
                    throw new InvalidCredentialsException();
                });

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            loginAttemptTracker.recordFailure(request.username());
            throw new InvalidCredentialsException();
        }

        loginAttemptTracker.recordSuccess(request.username());
        user.setLastLoginAt(Instant.now());
        userRepository.save(user);

        String token = jwtService.generateToken(user.getId(), user.getUsername(), user.getRole().name());
        return new AuthResponse(token, UserResponse.from(user));
    }
}
