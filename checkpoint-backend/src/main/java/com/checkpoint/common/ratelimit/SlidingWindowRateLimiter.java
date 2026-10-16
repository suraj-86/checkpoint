package com.checkpoint.common.ratelimit;

import java.time.Clock;
import java.util.ArrayDeque;
import java.util.concurrent.ConcurrentHashMap;

public class SlidingWindowRateLimiter {

    private static final int PRUNE_THRESHOLD = 10_000;

    private final int max;
    private final long windowMillis;
    private final Clock clock;
    private final ConcurrentHashMap<String, ArrayDeque<Long>> hits = new ConcurrentHashMap<>();

    public SlidingWindowRateLimiter(int max, long windowMillis, Clock clock) {
        this.max = max;
        this.windowMillis = windowMillis;
        this.clock = clock;
    }

    public boolean tryAcquire(String key) {
        long now = clock.millis();
        long cutoff = now - windowMillis;
        ArrayDeque<Long> queue = hits.computeIfAbsent(key, k -> new ArrayDeque<>());
        boolean allowed;
        synchronized (queue) {
            while (!queue.isEmpty() && queue.peekFirst() <= cutoff) {
                queue.pollFirst();
            }
            allowed = queue.size() < max;
            if (allowed) {
                queue.addLast(now);
            }
        }
        if (hits.size() > PRUNE_THRESHOLD) {
            prune(cutoff);
        }
        return allowed;
    }

    private void prune(long cutoff) {
        hits.entrySet().removeIf(entry -> {
            ArrayDeque<Long> queue = entry.getValue();
            synchronized (queue) {
                return queue.isEmpty() || queue.peekLast() <= cutoff;
            }
        });
    }
}
