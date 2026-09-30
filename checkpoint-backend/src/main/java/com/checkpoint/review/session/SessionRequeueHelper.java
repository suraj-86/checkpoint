package com.checkpoint.review.session;

import com.checkpoint.question.entity.Question;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

public class SessionRequeueHelper {

    public static final int MIN_SEPARATION = 2;

    private final Set<UUID> alreadyRequeued = new HashSet<>();

    public boolean requeue(List<Question> queue, int currentIndex, Question wrongQuestion) {
        if (!alreadyRequeued.add(wrongQuestion.getId())) {
            return false;
        }

        int insertAt = Math.min(currentIndex + 1 + MIN_SEPARATION, queue.size());
        queue.add(insertAt, wrongQuestion);
        return true;
    }

    public boolean hasBeenRequeued(UUID questionId) {
        return alreadyRequeued.contains(questionId);
    }
}
