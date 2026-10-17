package com.checkpoint.admin.service;

import com.checkpoint.admin.dto.AdminQuestionSummary;
import com.checkpoint.admin.dto.QuestionSearchFilter;
import com.checkpoint.catalog.entity.Exam;
import com.checkpoint.catalog.entity.Stream;
import com.checkpoint.catalog.entity.Subject;
import com.checkpoint.common.dto.PageResponse;
import com.checkpoint.common.exception.NotFoundException;
import com.checkpoint.question.entity.Question;
import com.checkpoint.question.repository.QuestionRepository;
import com.checkpoint.topic.entity.Topic;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class QuestionAdminService {

    private final QuestionRepository questionRepository;

    public QuestionAdminService(QuestionRepository questionRepository) {
        this.questionRepository = questionRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<AdminQuestionSummary> search(QuestionSearchFilter filter, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.min(Math.max(1, size), 100),
                Sort.by(Sort.Direction.DESC, "createdAt"));
        return PageResponse.from(
                questionRepository.findAll(specification(filter), pageable).map(AdminQuestionSummary::from));
    }

    static Specification<Question> specification(QuestionSearchFilter f) {
        return (root, query, cb) -> {
            List<Predicate> all = new ArrayList<>();
            Join<Question, Topic> topic = root.join("topic");
            Join<Topic, Subject> subject = topic.join("subject", JoinType.LEFT);

            if (f.topicId() != null) all.add(cb.equal(topic.get("id"), f.topicId()));
            if (f.subjectId() != null) all.add(cb.equal(subject.get("id"), f.subjectId()));
            if (f.datasetId() != null) all.add(cb.equal(root.get("dataset").get("id"), f.datasetId()));
            if (f.difficulty() != null) all.add(cb.equal(root.get("difficulty"), f.difficulty()));
            if (f.type() != null) all.add(cb.equal(root.get("questionType"), f.type()));
            if (f.active() != null) all.add(cb.equal(root.get("active"), f.active()));

            if (f.streamId() != null) {
                Subquery<UUID> sub = query.subquery(UUID.class);
                Root<Subject> s = sub.from(Subject.class);
                Join<Subject, Stream> st = s.join("streams");
                sub.select(s.get("id")).where(cb.equal(s.get("id"), subject.get("id")), cb.equal(st.get("id"), f.streamId()));
                all.add(cb.exists(sub));
            }
            if (f.examId() != null) {
                Subquery<UUID> sub = query.subquery(UUID.class);
                Root<Subject> s = sub.from(Subject.class);
                Join<Subject, Exam> ex = s.join("exams");
                sub.select(s.get("id")).where(cb.equal(s.get("id"), subject.get("id")), cb.equal(ex.get("id"), f.examId()));
                all.add(cb.exists(sub));
            }

            if (f.text() != null && !f.text().isBlank()) {
                String pattern = like(f.text().trim());
                all.add(cb.or(
                        cb.like(cb.lower(root.get("questionText")), pattern, '\\'),
                        cb.like(cb.lower(root.get("externalId")), pattern, '\\'),
                        cb.like(cb.lower(cb.coalesce(root.<String>get("subtopic"), "")), pattern, '\\')));
            }
            return cb.and(all.toArray(new Predicate[0]));
        };
    }

    private static String like(String text) {
        String escaped = text.toLowerCase().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
        return "%" + escaped + "%";
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
