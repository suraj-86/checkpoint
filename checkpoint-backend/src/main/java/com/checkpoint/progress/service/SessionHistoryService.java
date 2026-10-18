package com.checkpoint.progress.service;

import com.checkpoint.common.dto.PageResponse;
import com.checkpoint.practice.entity.PracticeSession;
import com.checkpoint.practice.entity.SessionQuestion;
import com.checkpoint.practice.repository.PracticeSessionRepository;
import com.checkpoint.practice.repository.SessionQuestionRepository;
import com.checkpoint.progress.dto.SessionHistoryFilter;
import com.checkpoint.progress.dto.SessionHistoryItem;
import com.checkpoint.progress.dto.SessionSummary;
import com.checkpoint.question.entity.Question;
import com.checkpoint.user.entity.User;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TreeSet;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class SessionHistoryService {

    static final int MAX_PAGE_SIZE = 50;

    private final PracticeSessionRepository sessionRepository;
    private final SessionQuestionRepository sessionQuestionRepository;

    public SessionHistoryService(PracticeSessionRepository sessionRepository,
                                 SessionQuestionRepository sessionQuestionRepository) {
        this.sessionRepository = sessionRepository;
        this.sessionQuestionRepository = sessionQuestionRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<SessionHistoryItem> search(User user, SessionHistoryFilter filter, int page, int size) {
        int safeSize = Math.max(1, Math.min(size, MAX_PAGE_SIZE));
        Sort sort = filter.oldestFirst() ? Sort.by("startedAt").ascending() : Sort.by("startedAt").descending();

        Page<PracticeSession> result = sessionRepository.findAll(
                specification(user.getId(), filter), PageRequest.of(Math.max(0, page), safeSize, sort));

        List<UUID> ids = result.getContent().stream().map(PracticeSession::getId).toList();
        Map<UUID, TreeSet<String>> topicsBySession = new HashMap<>();
        if (!ids.isEmpty()) {
            for (Object[] row : sessionQuestionRepository.findTopicNamesForSessions(ids)) {
                topicsBySession.computeIfAbsent((UUID) row[0], k -> new TreeSet<>()).add((String) row[1]);
            }
        }

        return PageResponse.from(result.map(s -> new SessionHistoryItem(
                SessionSummary.from(s),
                s.getPrimaryQuestionCount(),
                List.copyOf(topicsBySession.getOrDefault(s.getId(), new TreeSet<>())))));
    }

    static Specification<PracticeSession> specification(UUID userId, SessionHistoryFilter f) {
        return (root, query, cb) -> {
            List<Predicate> all = new ArrayList<>();
            all.add(cb.equal(root.get("user").get("id"), userId));

            if (f.type() != null) {
                all.add(cb.equal(root.get("sessionType"), f.type()));
            }
            if (f.status() != null) {
                all.add(cb.equal(root.get("status"), f.status()));
            }
            if (f.from() != null) {
                all.add(cb.greaterThanOrEqualTo(root.<Instant>get("startedAt"), f.from()));
            }
            if (f.to() != null) {
                all.add(cb.lessThan(root.<Instant>get("startedAt"), f.to()));
            }
            if ("PERFECT".equals(f.result())) {
                all.add(cb.equal(root.<Integer>get("wrongCount"), 0));
                all.add(cb.greaterThan(root.<Integer>get("correctCount"), 0));
            } else if ("HAS_WRONG".equals(f.result())) {
                all.add(cb.greaterThan(root.<Integer>get("wrongCount"), 0));
            }

            String text = f.text() == null ? "" : f.text().trim();
            if (f.topicId() != null || f.subjectId() != null || !text.isEmpty()) {
                Subquery<Integer> sub = query.subquery(Integer.class);
                Root<SessionQuestion> sq = sub.from(SessionQuestion.class);
                Join<SessionQuestion, Question> q = sq.join("question");
                List<Predicate> inner = new ArrayList<>();
                inner.add(cb.equal(sq.get("session"), root));
                inner.add(cb.isTrue(sq.<Boolean>get("primary")));
                if (f.topicId() != null) {
                    inner.add(cb.equal(q.get("topic").get("id"), f.topicId()));
                }
                if (f.subjectId() != null) {
                    inner.add(cb.equal(q.get("topic").get("subject").get("id"), f.subjectId()));
                }
                if (!text.isEmpty()) {
                    String pattern = "%" + escapeLike(text.toLowerCase(Locale.ROOT)) + "%";
                    inner.add(cb.or(
                            cb.like(cb.lower(q.<String>get("questionText")), pattern, '\\'),
                            cb.like(cb.lower(q.<String>get("subtopic")), pattern, '\\')));
                }
                sub.select(cb.literal(1)).where(inner.toArray(new Predicate[0]));
                all.add(cb.exists(sub));
            }
            return cb.and(all.toArray(new Predicate[0]));
        };
    }

    static String escapeLike(String s) {
        return s.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}
