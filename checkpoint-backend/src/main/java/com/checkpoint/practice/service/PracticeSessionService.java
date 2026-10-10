package com.checkpoint.practice.service;

import com.checkpoint.common.exception.BadRequestException;
import com.checkpoint.common.exception.ConflictException;
import com.checkpoint.common.exception.NotFoundException;
import com.checkpoint.interest.repository.UserInterestRepository;
import com.checkpoint.practice.dto.*;
import com.checkpoint.practice.entity.*;
import com.checkpoint.practice.repository.PracticeSessionRepository;
import com.checkpoint.practice.repository.QuestionAttemptRepository;
import com.checkpoint.practice.repository.SessionQuestionRepository;
import com.checkpoint.question.entity.Difficulty;
import com.checkpoint.question.entity.Question;
import com.checkpoint.question.repository.QuestionRepository;
import com.checkpoint.question.util.QuestionTypeCodec;
import com.checkpoint.review.service.QuestionSelectionService;
import com.checkpoint.review.service.ReviewProgressService;
import com.checkpoint.user.entity.User;
import com.checkpoint.xp.service.XpAwardService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class PracticeSessionService {

    private static final int DAILY_SESSION_SIZE = 10;

    private static final int REQUEUE_MIN_SEPARATION = 2;

    private final PracticeSessionRepository sessionRepository;
    private final SessionQuestionRepository sessionQuestionRepository;
    private final QuestionAttemptRepository attemptRepository;
    private final QuestionRepository questionRepository;
    private final QuestionSelectionService selectionService;
    private final ReviewProgressService reviewProgressService;
    private final AnswerEvaluator answerEvaluator;
    private final XpAwardService xpAwardService;
    private final UserInterestRepository interestRepository;
    private final Clock clock;

    public PracticeSessionService(
            PracticeSessionRepository sessionRepository,
            SessionQuestionRepository sessionQuestionRepository,
            QuestionAttemptRepository attemptRepository,
            QuestionRepository questionRepository,
            QuestionSelectionService selectionService,
            ReviewProgressService reviewProgressService,
            AnswerEvaluator answerEvaluator,
            XpAwardService xpAwardService,
            UserInterestRepository interestRepository,
            Clock clock
    ) {
        this.sessionRepository = sessionRepository;
        this.sessionQuestionRepository = sessionQuestionRepository;
        this.attemptRepository = attemptRepository;
        this.questionRepository = questionRepository;
        this.selectionService = selectionService;
        this.reviewProgressService = reviewProgressService;
        this.answerEvaluator = answerEvaluator;
        this.xpAwardService = xpAwardService;
        this.interestRepository = interestRepository;
        this.clock = clock;
    }


    @Transactional
    public ActiveSessionResponse startDaily(User student) {
        requireNoActiveSession(student);

        Instant now = Instant.now(clock);
        Set<UUID> interests = interestRepository.findTopicIds(student.getId());
        var selection = selectionService.selectForSession(student.getId(), DAILY_SESSION_SIZE, now, interests);
        List<Question> chosen = selection.questions();

        if (chosen.isEmpty()) {
            throw new BadRequestException("No questions are available to build a session yet.");
        }

        PracticeSession session = createSession(student, SessionType.DAILY, chosen);
        return buildActiveSessionResponse(session);
    }

    @Transactional
    public ActiveSessionResponse startFast(User student, FastPracticeStartRequest request) {
        requireNoActiveSession(student);

        String difficultyName = null;
        if (request.difficulty() != null) {
            try {
                difficultyName = Difficulty.valueOf(request.difficulty()).name();
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Invalid difficulty: " + request.difficulty());
            }
        }

        String questionTypeName = null;
        if (request.questionType() != null) {
            if (!QuestionTypeCodec.isValid(request.questionType())) {
                throw new BadRequestException("Invalid questionType: " + request.questionType());
            }
            questionTypeName = QuestionTypeCodec.decode(request.questionType()).name();
        }

        List<Question> chosen = questionRepository.findRandomActive(
                request.topicId(), difficultyName, questionTypeName, request.count());

        if (chosen.isEmpty()) {
            throw new BadRequestException("No active questions match the given filters.");
        }

        PracticeSession session = createSession(student, SessionType.FAST, chosen);
        return buildActiveSessionResponse(session);
    }

    private void requireNoActiveSession(User student) {
        sessionRepository.findByUserIdAndStatus(student.getId(), SessionStatus.IN_PROGRESS)
                .ifPresent(s -> {
                    throw new ConflictException("ACTIVE_SESSION_EXISTS",
                            "You already have an active practice session. Finish it, or resume it at GET /api/practice/active.");
                });
    }

    private PracticeSession createSession(User student, SessionType type, List<Question> chosen) {
        PracticeSession session = sessionRepository.save(PracticeSession.builder()
                .user(student)
                .sessionType(type)
                .primaryQuestionCount(chosen.size())
                .build());

        List<SessionQuestion> slots = new ArrayList<>(chosen.size());
        for (int i = 0; i < chosen.size(); i++) {
            slots.add(SessionQuestion.builder()
                    .session(session)
                    .question(chosen.get(i))
                    .queuePosition(i)
                    .primary(true)
                    .build());
        }
        sessionQuestionRepository.saveAll(slots);
        return session;
    }


    @Transactional(readOnly = true)
    public ActiveSessionResponse getActive(User student) {
        PracticeSession session = sessionRepository
                .findByUserIdAndStatus(student.getId(), SessionStatus.IN_PROGRESS)
                .orElseThrow(() -> new NotFoundException("No active practice session."));
        return buildActiveSessionResponse(session);
    }

    private ActiveSessionResponse buildActiveSessionResponse(PracticeSession session) {
        long totalSlots = sessionQuestionRepository.findBySessionIdOrderByQueuePositionAsc(session.getId()).size();
        long answeredSlots = sessionQuestionRepository.countBySessionIdAndAnsweredTrue(session.getId());
        long answeredPrimary = sessionQuestionRepository.countBySessionIdAndPrimaryTrueAndAnsweredTrue(session.getId());

        StudentQuestionResponse current = sessionQuestionRepository
                .findFirstBySessionIdAndAnsweredFalseOrderByQueuePositionAsc(session.getId())
                .map(slot -> StudentQuestionResponse.from(slot.getQuestion(), shuffledOptionsOrNull(slot.getQuestion())))
                .orElse(null);

        return new ActiveSessionResponse(
                session.getId(),
                session.getSessionType().name(),
                session.getPrimaryQuestionCount(),
                (int) answeredPrimary,
                (int) totalSlots,
                (int) answeredSlots,
                current
        );
    }

    private List<String> shuffledOptionsOrNull(Question question) {
        Object raw = question.getAnswerData().get("options");
        if (!(raw instanceof List<?> optionsList)) {
            return null;
        }
        List<String> options = new ArrayList<>();
        for (Object o : optionsList) {
            options.add(String.valueOf(o));
        }
        Collections.shuffle(options);
        return options;
    }


    @Transactional
    public AnswerResultResponse submitAnswer(User student, UUID sessionId, AnswerSubmitRequest request) {
        PracticeSession session = sessionRepository.findById(sessionId)
                .filter(s -> s.getUser().getId().equals(student.getId()))
                .orElseThrow(() -> new NotFoundException("Session not found."));

        if (session.getStatus() != SessionStatus.IN_PROGRESS) {
            throw new ConflictException("SESSION_ALREADY_FINISHED", "This session is no longer in progress.");
        }

        Question question = questionRepository.findById(request.questionId())
                .orElseThrow(() -> new NotFoundException("Question not found."));

        SessionQuestion slot = sessionQuestionRepository
                .findFirstBySessionIdAndQuestionIdAndAnsweredFalseOrderByQueuePositionAsc(sessionId, request.questionId())
                .orElseThrow(() -> new BadRequestException(
                        "This question is not part of the current session, or has already been answered."));

        AnswerEvaluator.Result result = answerEvaluator.evaluate(
                question.getQuestionType(), question.getAnswerData(), request.answer());

        slot.setAnswered(true);
        sessionQuestionRepository.save(slot);

        attemptRepository.save(QuestionAttempt.builder()
                .session(session)
                .question(question)
                .user(student)
                .primary(slot.isPrimary())
                .correct(result.correct())
                .submittedAnswer(Map.of("value", request.answer()))
                .answeredAt(Instant.now(clock))
                .build());

        reviewProgressService.recordAnswer(student, question, result.correct(), Instant.now(clock));

        session.setAttemptCount(session.getAttemptCount() + 1);
        if (slot.isPrimary()) {
            if (result.correct()) {
                session.setCorrectCount(session.getCorrectCount() + 1);
            } else {
                session.setWrongCount(session.getWrongCount() + 1);
            }
        }

        boolean requeued = false;
        if (!result.correct()) {
            requeued = tryRequeue(session, slot, question);
        }
        sessionRepository.save(session);

        return new AnswerResultResponse(result.correct(), result.correctAnswer(), question.getExplanation(), requeued);
    }

    private boolean tryRequeue(PracticeSession session, SessionQuestion answeredSlot, Question question) {
        boolean alreadyRequeued = sessionQuestionRepository
                .existsBySessionIdAndQuestionIdAndPrimaryFalse(session.getId(), question.getId());
        if (alreadyRequeued) {
            return false;
        }

        List<SessionQuestion> ordered =
                sessionQuestionRepository.findBySessionIdOrderByQueuePositionAsc(session.getId());

        int answeredIndex = -1;
        for (int i = 0; i < ordered.size(); i++) {
            if (ordered.get(i).getId().equals(answeredSlot.getId())) {
                answeredIndex = i;
                break;
            }
        }
        if (answeredIndex == -1) {
            throw new IllegalStateException("Answered slot not found in its own session's queue: " + answeredSlot.getId());
        }
        int insertAt = Math.min(answeredIndex + 1 + REQUEUE_MIN_SEPARATION, ordered.size());

        for (int i = ordered.size() - 1; i >= insertAt; i--) {
            SessionQuestion s = ordered.get(i);
            s.setQueuePosition(s.getQueuePosition() + 1);
            sessionQuestionRepository.save(s);
        }

        sessionQuestionRepository.save(SessionQuestion.builder()
                .session(session)
                .question(question)
                .queuePosition(insertAt)
                .primary(false)
                .build());

        return true;
    }


    @Transactional
    public SessionAbandonResponse abandonSession(User student, UUID sessionId) {
        PracticeSession session = sessionRepository.findById(sessionId)
                .filter(s -> s.getUser().getId().equals(student.getId()))
                .orElseThrow(() -> new NotFoundException("Session not found."));

        if (session.getStatus() != SessionStatus.IN_PROGRESS) {
            throw new ConflictException("SESSION_ALREADY_FINISHED", "This session is no longer in progress.");
        }

        // Answers already given stay recorded in the student's progress, but an
        // abandoned session awards no XP and does not count towards the streak.
        session.setStatus(SessionStatus.ABANDONED);
        session.setCompletedAt(Instant.now(clock));
        sessionRepository.save(session);

        return new SessionAbandonResponse(
                session.getId(),
                session.getStatus().name(),
                session.getCorrectCount() + session.getWrongCount(),
                session.getCorrectCount(),
                session.getPrimaryQuestionCount()
        );
    }

    @Transactional
    public SessionCompletionResponse completeSession(User student, UUID sessionId) {
        PracticeSession session = sessionRepository.findById(sessionId)
                .filter(s -> s.getUser().getId().equals(student.getId()))
                .orElseThrow(() -> new NotFoundException("Session not found."));

        if (session.getStatus() != SessionStatus.IN_PROGRESS) {
            throw new ConflictException("SESSION_ALREADY_FINISHED", "This session is no longer in progress.");
        }

        BigDecimal accuracy = session.getPrimaryQuestionCount() == 0
                ? null
                : BigDecimal.valueOf(session.getCorrectCount())
                        .divide(BigDecimal.valueOf(session.getPrimaryQuestionCount()), 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100))
                        .setScale(2, RoundingMode.HALF_UP);

        XpAwardService.AwardResult award = xpAwardService.award(session);

        session.setStatus(SessionStatus.COMPLETED);
        session.setAccuracy(accuracy);
        session.setXpChange(award.xpChange());
        session.setCompletedAt(Instant.now(clock));
        sessionRepository.save(session);

        return new SessionCompletionResponse(
                session.getId(),
                session.getStatus().name(),
                session.getPrimaryQuestionCount(),
                session.getCorrectCount(),
                session.getWrongCount(),
                session.getAccuracy(),
                award.xpChange(),
                award.totalXp(),
                award.levelAfter(),
                award.leveledUp(),
                award.currentStreak(),
                award.longestStreak(),
                award.streakMilestoneBonus()
        );
    }
}
