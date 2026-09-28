package com.checkpoint.review.session;

import com.checkpoint.question.entity.Question;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Per docs/08-Review-Learning-Algorithm.md section 9: same-session requeue
 * is a SEPARATE mechanism from long-term review scheduling
 * (ReviewProgressService). If a student gets a question wrong, it may
 * reappear later in the SAME session, separated by at least two other
 * questions, and at most once.
 *
 * One instance of this class is meant to live for the lifetime of a single
 * practice session (a new instance per session — it is NOT a Spring bean,
 * since its state is per-session, not shared/singleton). Phase 5 wires
 * this into actual session assembly; this phase provides and tests the
 * mechanism itself.
 */
public class SessionRequeueHelper {

    /** "Separated by at least two other questions" (section 9's Q5/Q6/Q7/Q5 example). */
    public static final int MIN_SEPARATION = 2;

    private final Set<UUID> alreadyRequeued = new HashSet<>();

    /**
     * Attempts to requeue {@code wrongQuestion} into {@code queue}, to
     * reappear after at least MIN_SEPARATION other questions.
     *
     * @param queue         the mutable, ordered list of questions for this session
     * @param currentIndex  the index the student just answered (0-based)
     * @param wrongQuestion the question they got wrong
     * @return true if the question was requeued, false if it had already
     *         been requeued once this session (section 9: "at most once
     *         in V1") — in which case the queue is left unchanged
     */
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
