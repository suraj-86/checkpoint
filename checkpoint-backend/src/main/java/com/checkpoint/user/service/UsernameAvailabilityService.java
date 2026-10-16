package com.checkpoint.user.service;

import com.checkpoint.common.exception.RateLimitExceededException;
import com.checkpoint.common.ratelimit.SlidingWindowRateLimiter;
import com.checkpoint.user.dto.UsernameCheckResponse;
import com.checkpoint.user.repository.UserRepository;
import com.checkpoint.user.rules.UsernameRules;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.util.Optional;
import java.util.UUID;

@Service
public class UsernameAvailabilityService {

    private static final int MAX_CHECKS = 30;
    private static final long WINDOW_MILLIS = 60_000;

    private final UserRepository userRepository;
    private final SlidingWindowRateLimiter limiter;

    public UsernameAvailabilityService(UserRepository userRepository, Clock clock) {
        this.userRepository = userRepository;
        this.limiter = new SlidingWindowRateLimiter(MAX_CHECKS, WINDOW_MILLIS, clock);
    }

    public UsernameCheckResponse check(String username, UUID callerId, String clientKey) {
        if (!limiter.tryAcquire(clientKey)) {
            throw new RateLimitExceededException("Too many username checks. Please wait a minute and try again.");
        }

        Optional<UsernameRules.Violation> violation = UsernameRules.check(username);
        if (violation.isPresent()) {
            UsernameRules.Violation v = violation.get();
            return new UsernameCheckResponse(username, false, v.code(), v.message());
        }

        if (callerId != null) {
            boolean isOwnName = userRepository.findById(callerId)
                    .map(u -> u.getUsername().equalsIgnoreCase(username))
                    .orElse(false);
            if (isOwnName) {
                return new UsernameCheckResponse(username, true, "CURRENT", "This is your current username.");
            }
        }

        if (userRepository.existsByUsernameIgnoreCase(username)) {
            return new UsernameCheckResponse(username, false, "TAKEN", "That username is already taken.");
        }
        return new UsernameCheckResponse(username, true, "OK", "Username is available.");
    }
}
