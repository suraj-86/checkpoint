package com.checkpoint.catalog.service;

import com.checkpoint.catalog.dto.CatalogResponse;
import com.checkpoint.catalog.dto.CatalogResponse.ExamItem;
import com.checkpoint.catalog.dto.CatalogResponse.StreamItem;
import com.checkpoint.catalog.dto.CatalogResponse.SubjectItem;
import com.checkpoint.catalog.dto.CatalogResponse.TopicItem;
import com.checkpoint.catalog.dto.NamedItemRequest;
import com.checkpoint.catalog.dto.SubjectRequest;
import com.checkpoint.catalog.dto.TopicRequest;
import com.checkpoint.catalog.entity.Exam;
import com.checkpoint.catalog.entity.Stream;
import com.checkpoint.catalog.entity.Subject;
import com.checkpoint.catalog.repository.ExamRepository;
import com.checkpoint.catalog.repository.StreamRepository;
import com.checkpoint.catalog.repository.SubjectRepository;
import com.checkpoint.common.exception.BadRequestException;
import com.checkpoint.common.exception.ConflictException;
import com.checkpoint.common.exception.NotFoundException;
import com.checkpoint.question.repository.QuestionRepository;
import com.checkpoint.topic.entity.Topic;
import com.checkpoint.topic.repository.TopicRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class CatalogService {

    public static final String DEFAULT_STREAM_NAME = "Computer Science";

    private final StreamRepository streamRepository;
    private final SubjectRepository subjectRepository;
    private final ExamRepository examRepository;
    private final TopicRepository topicRepository;
    private final QuestionRepository questionRepository;

    public CatalogService(
            StreamRepository streamRepository,
            SubjectRepository subjectRepository,
            ExamRepository examRepository,
            TopicRepository topicRepository,
            QuestionRepository questionRepository
    ) {
        this.streamRepository = streamRepository;
        this.subjectRepository = subjectRepository;
        this.examRepository = examRepository;
        this.topicRepository = topicRepository;
        this.questionRepository = questionRepository;
    }

    @Transactional(readOnly = true)
    public CatalogResponse snapshot() {
        List<Subject> subjects = subjectRepository.findAllByOrderBySortOrderAscNameAsc();

        Map<UUID, long[]> counts = new HashMap<>();
        for (Object[] row : questionRepository.countPerTopic()) {
            counts.put((UUID) row[0], new long[]{(Long) row[1], (Long) row[2]});
        }

        Map<UUID, List<Topic>> topicsBySubject = new HashMap<>();
        for (Topic topic : topicRepository.findAll()) {
            if (topic.getSubject() == null) continue;
            topicsBySubject.computeIfAbsent(topic.getSubject().getId(), k -> new ArrayList<>()).add(topic);
        }

        Map<UUID, Integer> subjectsPerStream = new HashMap<>();
        Map<UUID, Integer> subjectsPerExam = new HashMap<>();
        List<SubjectItem> subjectItems = new ArrayList<>();
        for (Subject subject : subjects) {
            for (Stream stream : subject.getStreams()) subjectsPerStream.merge(stream.getId(), 1, Integer::sum);
            for (Exam exam : subject.getExams()) subjectsPerExam.merge(exam.getId(), 1, Integer::sum);

            List<TopicItem> topicItems = topicsBySubject.getOrDefault(subject.getId(), List.of()).stream()
                    .sorted(Comparator.comparingInt(Topic::getSortOrder).thenComparing(Topic::getName, String.CASE_INSENSITIVE_ORDER))
                    .map(t -> {
                        long[] c = counts.getOrDefault(t.getId(), new long[]{0, 0});
                        return new TopicItem(t.getId(), t.getName(), t.getSortOrder(), t.isActive(), c[0], c[1]);
                    })
                    .toList();

            subjectItems.add(new SubjectItem(
                    subject.getId(), subject.getName(), subject.getDescription(), subject.getSortOrder(), subject.isActive(),
                    subject.getStreams().stream().map(Stream::getId).toList(),
                    subject.getExams().stream().map(Exam::getId).toList(),
                    topicItems));
        }

        List<StreamItem> streamItems = streamRepository.findAllByOrderBySortOrderAscNameAsc().stream()
                .map(s -> new StreamItem(s.getId(), s.getName(), s.getDescription(), s.getSortOrder(), s.isActive(),
                        subjectsPerStream.getOrDefault(s.getId(), 0)))
                .toList();
        List<ExamItem> examItems = examRepository.findAllByOrderBySortOrderAscNameAsc().stream()
                .map(e -> new ExamItem(e.getId(), e.getName(), e.getDescription(), e.getSortOrder(), e.isActive(),
                        subjectsPerExam.getOrDefault(e.getId(), 0)))
                .toList();

        return new CatalogResponse(streamItems, subjectItems, examItems);
    }

    @Transactional
    public CatalogResponse createStream(NamedItemRequest request) {
        String name = cleanName(request.name());
        if (streamRepository.existsByNameIgnoreCase(name)) throw nameTaken("Stream", name);
        streamRepository.save(Stream.builder()
                .name(name)
                .description(cleanText(request.description()))
                .sortOrder(request.sortOrder() == null ? 0 : request.sortOrder())
                .active(request.active() == null || request.active())
                .build());
        return snapshot();
    }

    @Transactional
    public CatalogResponse updateStream(UUID id, NamedItemRequest request) {
        Stream stream = streamRepository.findById(id).orElseThrow(() -> new NotFoundException("Stream not found"));
        String name = cleanName(request.name());
        if (streamRepository.existsByNameIgnoreCaseAndIdNot(name, id)) throw nameTaken("Stream", name);
        stream.setName(name);
        stream.setDescription(cleanText(request.description()));
        if (request.sortOrder() != null) stream.setSortOrder(request.sortOrder());
        if (request.active() != null) stream.setActive(request.active());
        streamRepository.save(stream);
        return snapshot();
    }

    @Transactional
    public CatalogResponse deleteStream(UUID id) {
        Stream stream = streamRepository.findById(id).orElseThrow(() -> new NotFoundException("Stream not found"));
        for (Subject subject : subjectRepository.findAll()) {
            if (subject.getStreams().removeIf(s -> s.getId().equals(id))) subjectRepository.save(subject);
        }
        streamRepository.delete(stream);
        return snapshot();
    }

    @Transactional
    public CatalogResponse createExam(NamedItemRequest request) {
        String name = cleanName(request.name());
        if (examRepository.existsByNameIgnoreCase(name)) throw nameTaken("Exam", name);
        examRepository.save(Exam.builder()
                .name(name)
                .description(cleanText(request.description()))
                .sortOrder(request.sortOrder() == null ? 0 : request.sortOrder())
                .active(request.active() == null || request.active())
                .build());
        return snapshot();
    }

    @Transactional
    public CatalogResponse updateExam(UUID id, NamedItemRequest request) {
        Exam exam = examRepository.findById(id).orElseThrow(() -> new NotFoundException("Exam not found"));
        String name = cleanName(request.name());
        if (examRepository.existsByNameIgnoreCaseAndIdNot(name, id)) throw nameTaken("Exam", name);
        exam.setName(name);
        exam.setDescription(cleanText(request.description()));
        if (request.sortOrder() != null) exam.setSortOrder(request.sortOrder());
        if (request.active() != null) exam.setActive(request.active());
        examRepository.save(exam);
        return snapshot();
    }

    @Transactional
    public CatalogResponse deleteExam(UUID id) {
        Exam exam = examRepository.findById(id).orElseThrow(() -> new NotFoundException("Exam not found"));
        for (Subject subject : subjectRepository.findAll()) {
            if (subject.getExams().removeIf(e -> e.getId().equals(id))) subjectRepository.save(subject);
        }
        examRepository.delete(exam);
        return snapshot();
    }

    @Transactional
    public CatalogResponse createSubject(SubjectRequest request) {
        String name = cleanName(request.name());
        if (subjectRepository.existsByNameIgnoreCase(name)) throw nameTaken("Subject", name);
        Subject subject = Subject.builder()
                .name(name)
                .description(cleanText(request.description()))
                .sortOrder(request.sortOrder() == null ? 0 : request.sortOrder())
                .active(request.active() == null || request.active())
                .build();
        subject.setStreams(loadStreams(request.streamIds()));
        subject.setExams(loadExams(request.examIds()));
        subjectRepository.save(subject);
        return snapshot();
    }

    @Transactional
    public CatalogResponse updateSubject(UUID id, SubjectRequest request) {
        Subject subject = subjectRepository.findById(id).orElseThrow(() -> new NotFoundException("Subject not found"));
        String name = cleanName(request.name());
        if (subjectRepository.existsByNameIgnoreCaseAndIdNot(name, id)) throw nameTaken("Subject", name);
        subject.setName(name);
        subject.setDescription(cleanText(request.description()));
        if (request.sortOrder() != null) subject.setSortOrder(request.sortOrder());
        if (request.active() != null) subject.setActive(request.active());
        if (request.streamIds() != null) subject.setStreams(loadStreams(request.streamIds()));
        if (request.examIds() != null) subject.setExams(loadExams(request.examIds()));
        subjectRepository.save(subject);
        return snapshot();
    }

    @Transactional
    public CatalogResponse deleteSubject(UUID id) {
        Subject subject = subjectRepository.findById(id).orElseThrow(() -> new NotFoundException("Subject not found"));
        List<Topic> topics = topicRepository.findBySubjectId(id);
        long questions = 0;
        for (Topic topic : topics) questions += questionRepository.countByTopicId(topic.getId());
        if (questions > 0) {
            throw new ConflictException("SUBJECT_HAS_QUESTIONS",
                    "This subject still has " + questions + " question(s). Retire the subject instead of deleting it.");
        }
        topicRepository.deleteAll(topics);
        subject.getStreams().clear();
        subject.getExams().clear();
        subjectRepository.save(subject);
        subjectRepository.delete(subject);
        return snapshot();
    }

    @Transactional
    public CatalogResponse createTopic(UUID subjectId, TopicRequest request) {
        Subject subject = subjectRepository.findById(subjectId).orElseThrow(() -> new NotFoundException("Subject not found"));
        String name = cleanName(request.name());
        if (topicRepository.existsByNameIgnoreCase(name)) throw nameTaken("Topic", name);
        topicRepository.save(Topic.builder()
                .name(name)
                .subject(subject)
                .sortOrder(request.sortOrder() == null ? 0 : request.sortOrder())
                .active(request.active() == null || request.active())
                .build());
        return snapshot();
    }

    @Transactional
    public CatalogResponse updateTopic(UUID id, TopicRequest request) {
        Topic topic = topicRepository.findById(id).orElseThrow(() -> new NotFoundException("Topic not found"));
        String name = cleanName(request.name());
        if (topicRepository.existsByNameIgnoreCaseAndIdNot(name, id)) throw nameTaken("Topic", name);
        topic.setName(name);
        if (request.sortOrder() != null) topic.setSortOrder(request.sortOrder());
        if (request.active() != null) topic.setActive(request.active());
        topicRepository.save(topic);
        return snapshot();
    }

    @Transactional
    public CatalogResponse deleteTopic(UUID id) {
        Topic topic = topicRepository.findById(id).orElseThrow(() -> new NotFoundException("Topic not found"));
        long questions = questionRepository.countByTopicId(id);
        if (questions > 0) {
            throw new ConflictException("TOPIC_HAS_QUESTIONS",
                    "This topic still has " + questions + " question(s). Retire the topic instead of deleting it.");
        }
        topicRepository.delete(topic);
        return snapshot();
    }

    /**
     * Used by the dataset importer until the upload page works with the hierarchy. A topic that does
     * not exist yet gets a subject of the same name inside the default stream, so nothing is left
     * outside the catalog.
     */
    @Transactional
    public Topic findOrCreateTopicByName(String rawName) {
        String name = cleanName(rawName);
        return topicRepository.findByName(name).orElseGet(() -> {
            Subject subject = subjectRepository.findByNameIgnoreCase(name).orElseGet(() -> createLegacySubject(name));
            return topicRepository.save(Topic.builder().name(name).subject(subject).build());
        });
    }

    private Subject createLegacySubject(String name) {
        Stream stream = streamRepository.findByNameIgnoreCase(DEFAULT_STREAM_NAME)
                .orElseGet(() -> streamRepository.save(Stream.builder().name(DEFAULT_STREAM_NAME).build()));
        Subject subject = Subject.builder().name(name).build();
        subject.getStreams().add(stream);
        return subjectRepository.save(subject);
    }

    private Set<Stream> loadStreams(List<UUID> ids) {
        Set<UUID> distinct = distinct(ids);
        if (distinct.isEmpty()) return new LinkedHashSet<>();
        List<Stream> found = streamRepository.findAllById(distinct);
        if (found.size() != distinct.size()) throw new BadRequestException("One or more streams do not exist");
        return new LinkedHashSet<>(found);
    }

    private Set<Exam> loadExams(List<UUID> ids) {
        Set<UUID> distinct = distinct(ids);
        if (distinct.isEmpty()) return new LinkedHashSet<>();
        List<Exam> found = examRepository.findAllById(distinct);
        if (found.size() != distinct.size()) throw new BadRequestException("One or more exams do not exist");
        return new LinkedHashSet<>(found);
    }

    private static Set<UUID> distinct(List<UUID> ids) {
        return ids == null ? Set.of() : new LinkedHashSet<>(ids);
    }

    static String cleanName(String raw) {
        return raw == null ? "" : raw.trim().replaceAll("\\s+", " ");
    }

    private static String cleanText(String raw) {
        if (raw == null) return null;
        String trimmed = raw.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static ConflictException nameTaken(String kind, String name) {
        return new ConflictException("NAME_TAKEN", kind + " \"" + name + "\" already exists");
    }
}
