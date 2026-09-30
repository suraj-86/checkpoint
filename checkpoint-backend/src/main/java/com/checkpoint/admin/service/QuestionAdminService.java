package com.checkpoint.admin.service;

import com.checkpoint.admin.dto.AdminQuestionSummary;
import com.checkpoint.common.dto.PageResponse;
import com.checkpoint.common.exception.NotFoundException;
import com.checkpoint.question.entity.Difficulty;
import com.checkpoint.question.entity.Question;
import com.checkpoint.question.entity.QuestionType;
import com.checkpoint.question.repository.QuestionRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class QuestionAdminService {

    private final QuestionRepository questionRepository;

    public QuestionAdminService(QuestionRepository questionRepository) {
        this.questionRepository = questionRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<AdminQuestionSummary> search(
            UUID topicId, Difficulty difficulty, QuestionType type, Boolean active, Pageable pageable
    ) {
        return PageResponse.from(
                questionRepository.search(topicId, difficulty, type, active, pageable)
                        .map(AdminQuestionSummary::from)
        );
    }

    @Transactional
    public AdminQuestionSummary retire(UUID questionId) {
        Question question = findOrThrow(questionId);
        question.setActive(false);
        return AdminQuestionSummary.from(questionRepository.save(question));
    }

    @Transactional
    public AdminQuestionSummary restore(UUID questionId) {
        Question question = findOrThrow(questionId);
        question.setActive(true);
        return AdminQuestionSummary.from(questionRepository.save(question));
    }

    private Question findOrThrow(UUID questionId) {
        return questionRepository.findById(questionId)
                .orElseThrow(() -> new NotFoundException("Question not found: " + questionId));
    }
}