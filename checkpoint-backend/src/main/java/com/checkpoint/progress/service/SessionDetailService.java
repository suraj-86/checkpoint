package com.checkpoint.progress.service;

import com.checkpoint.common.exception.NotFoundException;
import com.checkpoint.practice.entity.PracticeSession;
import com.checkpoint.practice.entity.QuestionAttempt;
import com.checkpoint.practice.entity.SessionQuestion;
import com.checkpoint.practice.entity.SessionStatus;
import com.checkpoint.practice.repository.PracticeSessionRepository;
import com.checkpoint.practice.repository.QuestionAttemptRepository;
import com.checkpoint.practice.repository.SessionQuestionRepository;
import com.checkpoint.progress.dto.SessionDetailResponse;
import com.checkpoint.progress.dto.SessionDetailResponse.QuestionReview;
import com.checkpoint.progress.dto.SessionSummary;
import com.checkpoint.question.entity.Question;
import com.checkpoint.question.util.QuestionTypeCodec;
import com.checkpoint.user.entity.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class SessionDetailService {

    private final PracticeSessionRepository sessionRepository;
    private final SessionQuestionRepository sessionQuestionRepository;
    private final QuestionAttemptRepository attemptRepository;

    public SessionDetailService(PracticeSessionRepository sessionRepository,
                                SessionQuestionRepository sessionQuestionRepository,
                                QuestionAttemptRepository attemptRepository) {
        this.sessionRepository = sessionRepository;
        this.sessionQuestionRepository = sessionQuestionRepository;
        this.attemptRepository = attemptRepository;
    }

    @Transactional(readOnly = true)
    public SessionDetailResponse getDetail(User user, UUID sessionId) {
        PracticeSession session = sessionRepository.findById(sessionId)
                .filter(s -> s.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new NotFoundException("Session not found."));

        boolean running = session.getStatus() == SessionStatus.IN_PROGRESS;

        Map<UUID, QuestionAttempt> primaryAttempts = new HashMap<>();
        for (QuestionAttempt a : attemptRepository.findBySessionIdOrderByAnsweredAtAsc(sessionId)) {
            if (a.isPrimary()) {
                primaryAttempts.putIfAbsent(a.getQuestion().getId(), a);
            }
        }

        List<QuestionReview> reviews = new ArrayList<>();
        int unanswered = 0;
        int number = 0;
        for (SessionQuestion slot : sessionQuestionRepository.findBySessionIdOrderByQueuePositionAsc(sessionId)) {
            if (!slot.isPrimary()) {
                continue;
            }
            number++;
            Question q = slot.getQuestion();
            QuestionAttempt attempt = primaryAttempts.get(q.getId());

            String status;
            Object yourAnswer = null;
            if (attempt == null) {
                status = "UNANSWERED";
                unanswered++;
            } else {
                status = attempt.isCorrect() ? "CORRECT" : "WRONG";
                if (attempt.getSubmittedAnswer() != null) {
                    yourAnswer = attempt.getSubmittedAnswer().get("value");
                }
            }

            boolean reveal = attempt != null || !running;
            reviews.add(new QuestionReview(
                    number,
                    q.getId(),
                    q.getQuestionText(),
                    QuestionTypeCodec.encode(q.getQuestionType()),
                    q.getDifficulty().name(),
                    q.getTopic().getName(),
                    q.getTopic().getId(),
                    q.getTopic().getSubject() == null ? null : q.getTopic().getSubject().getName(),
                    q.getSubtopic(),
                    optionsOf(q),
                    status,
                    yourAnswer,
                    reveal ? correctAnswerOf(q) : null,
                    reveal ? q.getExplanation() : null
            ));
        }

        return new SessionDetailResponse(SessionSummary.from(session), reviews.size(), unanswered, reviews);
    }

    private static List<String> optionsOf(Question q) {
        Object raw = q.getAnswerData().get("options");
        if (!(raw instanceof List<?> list)) {
            return null;
        }
        List<String> options = new ArrayList<>();
        for (Object o : list) {
            options.add(String.valueOf(o));
        }
        return options;
    }

    private static Object correctAnswerOf(Question q) {
        Object single = q.getAnswerData().get("correctAnswer");
        return single != null ? single : q.getAnswerData().get("acceptedAnswers");
    }
}
