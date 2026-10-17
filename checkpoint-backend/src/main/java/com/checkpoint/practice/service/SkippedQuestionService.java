package com.checkpoint.practice.service;

import com.checkpoint.practice.entity.SkippedQuestion;
import com.checkpoint.practice.repository.SkippedQuestionRepository;
import com.checkpoint.question.entity.Question;
import com.checkpoint.user.entity.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Service
public class SkippedQuestionService {

    private final SkippedQuestionRepository repository;
    private final Clock clock;

    public SkippedQuestionService(SkippedQuestionRepository repository, Clock clock) {
        this.repository = repository;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<Question> pool(UUID userId) {
        return repository.findAllWithQuestion(userId).stream()
                .map(SkippedQuestion::getQuestion)
                .filter(Question::isActive)
                .toList();
    }

    @Transactional
    public void addAll(User user, Collection<Question> questions) {
        Instant now = Instant.now(clock);
        for (Question q : questions) {
            if (!repository.existsByUserIdAndQuestionId(user.getId(), q.getId())) {
                repository.save(SkippedQuestion.builder().user(user).question(q).skippedAt(now).build());
            }
        }
    }

    @Transactional
    public void remove(UUID userId, UUID questionId) {
        repository.deleteByUserIdAndQuestionId(userId, questionId);
    }
}
