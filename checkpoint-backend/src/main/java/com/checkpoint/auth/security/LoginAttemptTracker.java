package com.checkpoint.auth.security;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

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
