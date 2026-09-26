package com.checkpoint.auth.security;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Deliberately simple, in-memory, per-username failed-attempt tracking.
 * Per docs/06-Authentication-and-Security.md section 11: "reasonable
 * protection... not a full enterprise identity system." This resets on
 * app restart, which is an accepted trade-off for a mini project — a real
 * deployment would back this with Redis or similar.
 */
@Component
public class LoginAttemptTracker {

    private static final int MAX_ATTEMPTS = 5;
    private static final long LOCKOUT_MINUTES = 15;

    private final ConcurrentHashMap<String, AtomicInteger> attempts = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Instant> lockedUntil = new ConcurrentHashMap<>();

    public boolean isLocked(String username) {
        Instant until = lockedUntil.get(username);
        if (until == null) {
            return false;
        }
        if (Instant.now().isAfter(until)) {
            // Lockout expired — clear it and let them try again.
            lockedUntil.remove(username);
            attempts.remove(username);
            return false;
        }
        return true;
    }

    public void recordFailure(String username) {
        int count = attempts.computeIfAbsent(username, k -> new AtomicInteger(0)).incrementAndGet();
        if (count >= MAX_ATTEMPTS) {
            lockedUntil.put(username, Instant.now().plusSeconds(LOCKOUT_MINUTES * 60));
        }
    }

    public void recordSuccess(String username) {
        attempts.remove(username);
        lockedUntil.remove(username);
    }
}
