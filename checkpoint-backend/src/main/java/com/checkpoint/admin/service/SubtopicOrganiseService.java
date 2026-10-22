package com.checkpoint.admin.service;

import com.checkpoint.admin.dto.SubtopicOrganiseDtos.Move;
import com.checkpoint.admin.dto.SubtopicOrganiseDtos.OrganiseResult;
import com.checkpoint.admin.dto.SubtopicOrganiseDtos.Preview;
import com.checkpoint.admin.dto.SubtopicOrganiseDtos.SubtopicRow;
import com.checkpoint.catalog.entity.Subject;
import com.checkpoint.catalog.repository.SubjectRepository;
import com.checkpoint.catalog.service.CatalogService;
import com.checkpoint.common.exception.BadRequestException;
import com.checkpoint.common.exception.NotFoundException;
import com.checkpoint.question.repository.QuestionOrganiseRepository;
import com.checkpoint.topic.entity.Topic;
import com.checkpoint.topic.repository.TopicRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Splits a subject's "General" topic into real topics using the subtopic stored on each question.
 * Question ids never change, so attempts, reviews and XP are untouched; only the topic link moves.
 */
@Service
public class SubtopicOrganiseService {

    static final String GENERAL = "General";
    static final int MAX_MOVES = 200;
    static final int MAX_NAME = 100;

    private final SubjectRepository subjectRepository;
    private final TopicRepository topicRepository;
    private final QuestionOrganiseRepository questionRepository;
    private final CatalogService catalogService;

    public SubtopicOrganiseService(
            SubjectRepository subjectRepository,
            TopicRepository topicRepository,
            QuestionOrganiseRepository questionRepository,
            CatalogService catalogService
    ) {
        this.subjectRepository = subjectRepository;
        this.topicRepository = topicRepository;
        this.questionRepository = questionRepository;
        this.catalogService = catalogService;
    }

    static String keyOf(String subtopic) {
        return subtopic == null ? "" : subtopic.trim().toLowerCase(Locale.ROOT);
    }

    private Subject requireSubject(UUID subjectId) {
        return subjectRepository.findById(subjectId).orElseThrow(() -> new NotFoundException("Subject not found."));
    }

    private Topic findGeneral(UUID subjectId) {
        return topicRepository.findBySubjectId(subjectId).stream()
                .filter(t -> GENERAL.equalsIgnoreCase(t.getName()))
                .findFirst()
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public Preview preview(UUID subjectId) {
        Subject subject = requireSubject(subjectId);
        List<String> existing = topicRepository.findBySubjectId(subjectId).stream()
                .map(Topic::getName)
                .sorted(String.CASE_INSENSITIVE_ORDER)
                .toList();

        Topic general = findGeneral(subjectId);
        if (general == null) {
            return new Preview(subjectId, subject.getName(), null, 0, 0, List.of(), existing);
        }

        long total = questionRepository.countByTopicId(general.getId());
        Map<String, Map<String, Long>> spellings = new HashMap<>();
        Map<String, Long> totals = new HashMap<>();
        for (Object[] row : questionRepository.countBySubtopic(general.getId())) {
            String label = ((String) row[0]).trim();
            String key = keyOf(label);
            if (key.isEmpty()) {
                continue;
            }
            long count = ((Number) row[1]).longValue();
            spellings.computeIfAbsent(key, k -> new HashMap<>()).merge(label, count, Long::sum);
            totals.merge(key, count, Long::sum);
        }

        List<SubtopicRow> rows = new ArrayList<>();
        long withSubtopic = 0;
        for (Map.Entry<String, Long> entry : totals.entrySet()) {
            String label = spellings.get(entry.getKey()).entrySet().stream()
                    .max(Map.Entry.<String, Long>comparingByValue().thenComparing(Map.Entry.<String, Long>comparingByKey()))
                    .map(Map.Entry::getKey)
                    .orElse(entry.getKey());
            rows.add(new SubtopicRow(entry.getKey(), label, entry.getValue()));
            withSubtopic += entry.getValue();
        }
        rows.sort(Comparator.comparingLong(SubtopicRow::count).reversed().thenComparing(SubtopicRow::label, String.CASE_INSENSITIVE_ORDER));

        return new Preview(subjectId, subject.getName(), general.getId(), total, Math.max(0, total - withSubtopic), rows, existing);
    }

    @Transactional
    public OrganiseResult organise(UUID subjectId, List<Move> moves) {
        requireSubject(subjectId);
        if (moves == null || moves.isEmpty()) {
            throw new BadRequestException("Choose at least one subtopic to move.");
        }
        if (moves.size() > MAX_MOVES) {
            throw new BadRequestException("Too many subtopics in one go (maximum " + MAX_MOVES + ").");
        }
        Topic general = findGeneral(subjectId);
        if (general == null) {
            throw new BadRequestException("This subject has no General topic to split.");
        }

        Set<String> before = new HashSet<>();
        topicRepository.findBySubjectId(subjectId).forEach(t -> before.add(t.getName().toLowerCase(Locale.ROOT)));

        int moved = 0;
        List<String> created = new ArrayList<>();
        Set<String> createdLower = new HashSet<>();
        for (Move move : moves) {
            String key = keyOf(move == null ? null : move.subtopic());
            String name = move == null || move.topicName() == null ? "" : move.topicName().trim();
            if (key.isEmpty() || name.isEmpty() || name.length() > MAX_NAME) {
                throw new BadRequestException("Every move needs a subtopic and a topic name of 1 to " + MAX_NAME + " characters.");
            }
            if (GENERAL.equalsIgnoreCase(name)) {
                continue;
            }
            Topic target = catalogService.findOrCreateTopicInSubject(subjectId, name);
            String lower = target.getName().toLowerCase(Locale.ROOT);
            if (!before.contains(lower) && createdLower.add(lower)) {
                created.add(target.getName());
            }
            moved += questionRepository.moveBySubtopic(general.getId(), target, key);
        }
        return new OrganiseResult(moved, created);
    }
}
