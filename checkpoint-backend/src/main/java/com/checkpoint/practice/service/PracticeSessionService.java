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
import com.checkpoint.question.entity.Question;
import com.checkpoint.question.repository.QuestionRepository;
import com.checkpoint.question.util.QuestionTypeCodec;
import com.checkpoint.review.service.QuestionSelectionService;
import com.checkpoint.review.service.ReviewProgressService;
import com.checkpoint.user.entity.User;
import com.checkpoint.xp.service.XpAwardService;
import com.checkpoint.question.entity.Difficulty;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.Set;
import java.util.UUID;

@Service
public class PracticeSessionService {

    private static final int DAILY_SESSION_SIZE = 10;

    private static final int DAILY_SKIPPED_LIMIT = 3;

    private final PracticeSessionRepository sessionRepository;
    private final SessionQuestionRepository sessionQuestionRepository;
    private final QuestionAttemptRepository attemptRepository;
    private final QuestionRepository questionRepository;
    private final QuestionSelectionService selectionService;
    private final ReviewProgressService reviewProgressService;
    private final AnswerEvaluator answerEvaluator;
    private final XpAwardService xpAwardService;
    private final UserInterestRepository interestRepository;
    private final SkippedQuestionService skippedQuestionService;
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
            SkippedQuestionService skippedQuestionService,
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
        this.skippedQuestionService = skippedQuestionService;
        this.clock = clock;
    }


    @Transactional
    public ActiveSessionResponse startDaily(User student) {
        requireNoActiveSession(student);

        Instant now = Instant.now(clock);
        Set<UUID> interests = interestRepository.findTopicIds(student.getId());
        var selection = selectionService.selectForSession(student.getId(), DAILY_SESSION_SIZE, now, interests);
        List<Question> chosen = withSkippedFirst(student, selection.questions());

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

        final String difficultyFilter = difficultyName;
        final String typeFilter = questionTypeName;
        List<Question> skipped = skippedQuestionService.pool(student.getId()).stream()
                .filter(q -> request.topicId() == null || q.getTopic().getId().equals(request.topicId()))
                .filter(q -> difficultyFilter == null || q.getDifficulty().name().equals(difficultyFilter))
                .filter(q -> typeFilter == null || q.getQuestionType().name().equals(typeFilter))
                .limit(request.count())
                .toList();

        List<Question> chosen = new ArrayList<>(skipped);
        Set<UUID> chosenIds = new HashSet<>();
        skipped.forEach(q -> chosenIds.add(q.getId()));
        for (Question q : questionRepository.findRandomActive(
                request.topicId(), difficultyName, questionTypeName, request.count() + skipped.size())) {
            if (chosen.size() >= request.count()) {
                break;
            }
            if (chosenIds.add(q.getId())) {
                chosen.add(q);
            }
        }

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

    private List<Question> withSkippedFirst(User student, List<Question> selected) {
        List<Question> skipped = skippedQuestionService.pool(student.getId()).stream()
                .limit(DAILY_SKIPPED_LIMIT)
                .toList();
        if (skipped.isEmpty()) {
            return selected;
        }
        List<Question> result = new ArrayList<>(skipped);
        Set<UUID> ids = new HashSet<>();
        skipped.forEach(q -> ids.add(q.getId()));
        for (Question q : selected) {
            if (result.size() >= DAILY_SESSION_SIZE) {
                break;
            }
            if (ids.add(q.getId())) {
                result.add(q);
            }
        }
        return result;
    }

    private static String key(UUID questionId, boolean primary) {
        return questionId + ":" + primary;
    }

    private Map<String, QuestionAttempt> attemptsBySlotKey(UUID sessionId) {
        Map<String, QuestionAttempt> map = new HashMap<>();
        for (QuestionAttempt a : attemptRepository.findBySessionIdOrderByAnsweredAtAsc(sessionId)) {
            map.putIfAbsent(key(a.getQuestion().getId(), a.isPrimary()), a);
        }
        return map;
    }

    private static String statusOf(SessionQuestion slot, Map<String, QuestionAttempt> attempts) {
        if (slot.isAnswered()) {
            QuestionAttempt attempt = attempts.get(key(slot.getQuestion().getId(), slot.isPrimary()));
            return attempt != null && attempt.isCorrect() ? "CORRECT" : "WRONG";
        }
        return slot.isSkipped() ? "SKIPPED" : "NOT_ATTEMPTED";
    }

    private ActiveSessionResponse buildActiveSessionResponse(PracticeSession session) {
        List<SessionQuestion> ordered = sessionQuestionRepository.findBySessionIdOrderByQueuePositionAsc(session.getId());
        Map<String, QuestionAttempt> attempts = attemptsBySlotKey(session.getId());

        List<SlotInfo> slots = new ArrayList<>(ordered.size());
        int firstNotAttempted = -1;
        int firstSkipped = -1;
        long answeredSlots = 0;
        long answeredPrimary = 0;
        for (int i = 0; i < ordered.size(); i++) {
            SessionQuestion slot = ordered.get(i);
            String status = statusOf(slot, attempts);
            slots.add(new SlotInfo(i + 1, slot.getQuestion().getId(), slot.isPrimary(), status));
            if (slot.isAnswered()) {
                answeredSlots++;
                if (slot.isPrimary()) {
                    answeredPrimary++;
                }
            }
            if (status.equals("NOT_ATTEMPTED") && firstNotAttempted == -1) {
                firstNotAttempted = i + 1;
            }
            if (status.equals("SKIPPED") && firstSkipped == -1) {
                firstSkipped = i + 1;
            }
        }
        int currentPosition = firstNotAttempted != -1 ? firstNotAttempted
                : firstSkipped != -1 ? firstSkipped
                : Math.max(1, ordered.size());

        StudentQuestionResponse current = null;
        if (firstNotAttempted != -1 || firstSkipped != -1) {
            SessionQuestion slot = ordered.get(currentPosition - 1);
            current = StudentQuestionResponse.from(slot.getQuestion(), optionsFor(slot));
        }

        return new ActiveSessionResponse(
                session.getId(),
                session.getSessionType().name(),
                session.getPrimaryQuestionCount(),
                (int) answeredPrimary,
                ordered.size(),
                (int) answeredSlots,
                current,
                slots,
                currentPosition
        );
    }

    private List<String> optionsFor(SessionQuestion slot) {
        Object raw = slot.getQuestion().getAnswerData().get("options");
        if (!(raw instanceof List<?> optionsList)) {
            return null;
        }
        List<String> options = new ArrayList<>();
        for (Object o : optionsList) {
            options.add(String.valueOf(o));
        }
        Collections.shuffle(options, new Random(slot.getId().getLeastSignificantBits()));
        return options;
    }

    private PracticeSession loadOwnedRunningSession(User student, UUID sessionId) {
        PracticeSession session = sessionRepository.findById(sessionId)
                .filter(s -> s.getUser().getId().equals(student.getId()))
                .orElseThrow(() -> new NotFoundException("Session not found."));
        if (session.getStatus() != SessionStatus.IN_PROGRESS) {
            throw new ConflictException("SESSION_ALREADY_FINISHED", "This session is no longer in progress.");
        }
        return session;
    }

    private SessionQuestion slotAt(UUID sessionId, int position) {
        List<SessionQuestion> ordered = sessionQuestionRepository.findBySessionIdOrderByQueuePositionAsc(sessionId);
        if (position < 1 || position > ordered.size()) {
            throw new NotFoundException("There is no question " + position + " in this session.");
        }
        return ordered.get(position - 1);
    }

    @Transactional(readOnly = true)
    public SlotQuestionResponse getSlot(User student, UUID sessionId, int position) {
        PracticeSession session = loadOwnedRunningSession(student, sessionId);
        SessionQuestion slot = slotAt(session.getId(), position);
        Map<String, QuestionAttempt> attempts = attemptsBySlotKey(session.getId());
        String status = statusOf(slot, attempts);
        Question question = slot.getQuestion();

        SlotQuestionResponse.Review review = null;
        if (slot.isAnswered()) {
            QuestionAttempt attempt = attempts.get(key(question.getId(), slot.isPrimary()));
            Object yourAnswer = attempt != null && attempt.getSubmittedAnswer() != null
                    ? attempt.getSubmittedAnswer().get("value") : null;
            Object single = question.getAnswerData().get("correctAnswer");
            Object correctAnswer = single != null ? single : question.getAnswerData().get("acceptedAnswers");
            review = new SlotQuestionResponse.Review(
                    attempt != null && attempt.isCorrect(), yourAnswer, correctAnswer, question.getExplanation());
        }

        return new SlotQuestionResponse(
                position, status, slot.isPrimary(),
                StudentQuestionResponse.from(question, optionsFor(slot)), review);
    }

    @Transactional
    public ActiveSessionResponse skipSlot(User student, UUID sessionId, int position) {
        PracticeSession session = loadOwnedRunningSession(student, sessionId);
        SessionQuestion slot = slotAt(session.getId(), position);
        if (slot.isAnswered()) {
            throw new BadRequestException("This question has already been answered.");
        }
        slot.setSkipped(true);
        sessionQuestionRepository.save(slot);
        return buildActiveSessionResponse(session);
    }

    @Transactional(readOnly = true)
    public ActiveSessionResponse getOverview(User student, UUID sessionId) {
        return buildActiveSessionResponse(loadOwnedRunningSession(student, sessionId));
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
        slot.setSkipped(false);
        sessionQuestionRepository.save(slot);
        skippedQuestionService.remove(student.getId(), question.getId());

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
        int nextPosition = ordered.isEmpty() ? 0 : ordered.get(ordered.size() - 1).getQueuePosition() + 1;

        sessionQuestionRepository.save(SessionQuestion.builder()
                .session(session)
                .question(question)
                .queuePosition(nextPosition)
                .primary(false)
                .build());

        return true;
    }


    @Transactional
    public SessionAbandonResponse abandonSession(User student, UUID sessionId) {
        PracticeSession session = loadOwnedRunningSession(student, sessionId);

        if (session.getSessionType() == SessionType.DAILY) {
            throw new BadRequestException(
                    "A Daily Session cannot be ended early. Submit it instead; unanswered questions count as unattempted.");
        }

        int skippedForLater = rememberUnansweredPrimaryQuestions(student, session);

        session.setStatus(SessionStatus.ABANDONED);
        session.setCompletedAt(Instant.now(clock));
        sessionRepository.save(session);

        return new SessionAbandonResponse(
                session.getId(),
                session.getStatus().name(),
                session.getCorrectCount() + session.getWrongCount(),
                session.getCorrectCount(),
                session.getPrimaryQuestionCount(),
                skippedForLater
        );
    }

    private List<SessionQuestion> unansweredPrimarySlots(UUID sessionId) {
        return sessionQuestionRepository.findBySessionIdOrderByQueuePositionAsc(sessionId).stream()
                .filter(slot -> slot.isPrimary() && !slot.isAnswered())
                .toList();
    }

    private int rememberUnansweredPrimaryQuestions(User student, PracticeSession session) {
        List<Question> unanswered = unansweredPrimarySlots(session.getId()).stream()
                .map(SessionQuestion::getQuestion)
                .toList();
        skippedQuestionService.addAll(student, unanswered);
        return unanswered.size();
    }

    @Transactional
    public SessionCompletionResponse completeSession(User student, UUID sessionId) {
        PracticeSession session = loadOwnedRunningSession(student, sessionId);

        int answeredCount = session.getCorrectCount() + session.getWrongCount();
        if (answeredCount == 0) {
            throw new BadRequestException(
                    "Answer at least one question before submitting. A Fast Practice session can be ended instead.");
        }

        List<SessionQuestion> unanswered = unansweredPrimarySlots(session.getId());
        boolean daily = session.getSessionType() == SessionType.DAILY;

        int denominator = daily ? session.getPrimaryQuestionCount() : answeredCount;
        BigDecimal accuracy = denominator == 0
                ? null
                : BigDecimal.valueOf(session.getCorrectCount())
                        .divide(BigDecimal.valueOf(denominator), 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100))
                        .setScale(2, RoundingMode.HALF_UP);

        List<Difficulty> unattemptedDifficulties = daily
                ? unanswered.stream().map(slot -> slot.getQuestion().getDifficulty()).toList()
                : List.of();
        XpAwardService.AwardResult award = xpAwardService.award(session, unattemptedDifficulties);

        if (!daily) {
            rememberUnansweredPrimaryQuestions(student, session);
        }

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
                award.streakMilestoneBonus(),
                answeredCount,
                unanswered.size()
        );
    }
}
