package com.checkpoint.progress.service;

import com.checkpoint.catalog.dto.CatalogResponse.SubjectItem;
import com.checkpoint.catalog.dto.CatalogResponse.TopicItem;
import com.checkpoint.catalog.service.CatalogService;
import com.checkpoint.progress.dto.MasteryResponse;
import com.checkpoint.progress.dto.MasteryTier;
import com.checkpoint.progress.dto.SubjectMastery;
import com.checkpoint.progress.dto.TopicMastery;
import com.checkpoint.review.entity.ReviewState;
import com.checkpoint.review.entity.UserQuestionProgress;
import com.checkpoint.review.repository.UserQuestionProgressRepository;
import com.checkpoint.user.entity.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class MasteryService {

    static final int MIN_ANSWERS_FOR_TIER = 3;
    static final int STRONG_FROM = 80;
    static final int GROWING_FROM = 60;
    static final int WEAKEST_LIMIT = 3;

    private final UserQuestionProgressRepository progressRepository;
    private final CatalogService catalogService;

    public MasteryService(UserQuestionProgressRepository progressRepository, CatalogService catalogService) {
        this.progressRepository = progressRepository;
        this.catalogService = catalogService;
    }

    @Transactional(readOnly = true)
    public MasteryResponse getMastery(User user) {
        Map<UUID, List<UserQuestionProgress>> byTopic = new HashMap<>();
        for (UserQuestionProgress p : progressRepository.findAllByUserIdWithQuestionAndTopic(user.getId())) {
            if (!p.getQuestion().isActive()) continue;
            byTopic.computeIfAbsent(p.getQuestion().getTopic().getId(), k -> new ArrayList<>()).add(p);
        }

        List<SubjectMastery> subjects = new ArrayList<>();
        List<TopicMastery> allTopics = new ArrayList<>();

        for (SubjectItem subject : catalogService.studentSnapshot().subjects()) {
            List<TopicMastery> topics = new ArrayList<>();
            for (TopicItem topic : subject.topics()) {
                TopicMastery tm = buildTopic(subject, topic, byTopic.getOrDefault(topic.id(), List.of()));
                topics.add(tm);
                allTopics.add(tm);
            }
            long active = topics.stream().mapToLong(TopicMastery::activeQuestions).sum();
            long seen = topics.stream().mapToLong(TopicMastery::questionsSeen).sum();
            long answers = topics.stream().mapToLong(TopicMastery::answers).sum();
            long correct = topics.stream().mapToLong(TopicMastery::correct).sum();
            subjects.add(new SubjectMastery(subject.id(), subject.name(), active, seen, answers, correct,
                    percent(correct, answers), topics));
        }

        return new MasteryResponse(subjects, weakest(allTopics, WEAKEST_LIMIT));
    }

    private TopicMastery buildTopic(SubjectItem subject, TopicItem topic, List<UserQuestionProgress> rows) {
        long seen = rows.stream().filter(p -> p.getTimesSeen() > 0).count();
        long answers = rows.stream().mapToLong(UserQuestionProgress::getTimesSeen).sum();
        long correct = rows.stream().mapToLong(UserQuestionProgress::getTimesCorrect).sum();
        long stable = rows.stream().filter(p -> p.getReviewState() == ReviewState.STABLE).count();
        return new TopicMastery(topic.id(), topic.name(), subject.id(), subject.name(),
                topic.activeQuestionCount(), seen, answers, correct, percent(correct, answers), stable,
                tierFor(answers, correct));
    }

    static int percent(long correct, long answers) {
        return answers == 0 ? 0 : (int) Math.round(correct * 100.0 / answers);
    }

    static MasteryTier tierFor(long answers, long correct) {
        if (answers <= 0) return MasteryTier.NOT_STARTED;
        if (answers < MIN_ANSWERS_FOR_TIER) return MasteryTier.STARTED;
        int accuracy = percent(correct, answers);
        if (accuracy >= STRONG_FROM) return MasteryTier.STRONG;
        if (accuracy >= GROWING_FROM) return MasteryTier.GROWING;
        return MasteryTier.NEEDS_WORK;
    }

    static List<TopicMastery> weakest(List<TopicMastery> topics, int limit) {
        return topics.stream()
                .filter(t -> t.tier() == MasteryTier.NEEDS_WORK)
                .sorted(Comparator.comparingInt(TopicMastery::accuracy)
                        .thenComparing(Comparator.comparingLong(TopicMastery::answers).reversed())
                        .thenComparing(TopicMastery::topicName))
                .limit(limit)
                .toList();
    }
}
