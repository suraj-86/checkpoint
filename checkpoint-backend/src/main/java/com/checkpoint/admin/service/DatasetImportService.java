package com.checkpoint.admin.service;

import com.checkpoint.admin.dto.*;
import com.checkpoint.admin.validation.QuestionValidator;
import com.checkpoint.catalog.service.CatalogService;
import com.checkpoint.common.exception.DatasetValidationException;
import com.checkpoint.question.entity.Difficulty;
import com.checkpoint.question.entity.Question;
import com.checkpoint.question.entity.QuestionDataset;
import com.checkpoint.question.util.QuestionTypeCodec;
import com.checkpoint.question.repository.QuestionDatasetRepository;
import com.checkpoint.question.repository.QuestionRepository;
import com.checkpoint.topic.entity.Topic;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class DatasetImportService {

    private final QuestionValidator validator;
    private final QuestionDatasetRepository datasetRepository;
    private final QuestionRepository questionRepository;
    private final CatalogService catalogService;

    public DatasetImportService(
            QuestionValidator validator,
            QuestionDatasetRepository datasetRepository,
            QuestionRepository questionRepository,
            CatalogService catalogService
    ) {
        this.validator = validator;
        this.datasetRepository = datasetRepository;
        this.questionRepository = questionRepository;
        this.catalogService = catalogService;
    }

    public ValidationResponse validate(DatasetUploadRequest request) {
        return validator.validate(request);
    }

    @Transactional
    public ImportResponse importDataset(DatasetUploadRequest request) {
        ValidationResponse validation = validator.validate(request);
        if (!validation.allValid()) {
            throw new DatasetValidationException(validation);
        }

        Topic fixedTopic = request.topicId() == null ? null : catalogService.requireTopic(request.topicId());

        QuestionDataset dataset = findOrCreateDataset(request.dataset());

        Map<String, Topic> topicCache = new HashMap<>();

        int created = 0;
        int updated = 0;

        for (QuestionUpload upload : request.questions()) {
            Topic topic = fixedTopic != null
                    ? fixedTopic
                    : topicCache.computeIfAbsent(upload.topic(), name -> resolveTopic(request, name));

            Question existing = questionRepository.findFirstByExternalId(upload.externalId()).orElse(null);

            if (existing != null) {
                applyUpload(existing, upload, dataset, topic);
                questionRepository.save(existing);
                updated++;
            } else {
                Question created0 = Question.builder()
                        .dataset(dataset)
                        .externalId(upload.externalId())
                        .build();
                applyUpload(created0, upload, dataset, topic);
                questionRepository.save(created0);
                created++;
            }
        }

        return new ImportResponse(
                dataset.getName(),
                dataset.getVersion(),
                request.questions().size(),
                created,
                updated,
                describeTarget(request, fixedTopic)
        );
    }

    private void applyUpload(Question question, QuestionUpload upload, QuestionDataset dataset, Topic topic) {
        question.setDataset(dataset);
        question.setTopic(topic);
        question.setSubtopic(upload.subtopic());
        question.setQuestionType(QuestionTypeCodec.decode(upload.type()));
        question.setDifficulty(Difficulty.valueOf(upload.difficulty()));
        question.setQuestionText(upload.question());
        question.setAnswerData(buildAnswerData(upload));
        question.setExplanation(upload.explanation());
    }

    private Map<String, Object> buildAnswerData(QuestionUpload upload) {
        Map<String, Object> data = new HashMap<>();
        switch (upload.type()) {
            case "MCQ" -> {
                data.put("options", upload.options());
                data.put("correctAnswer", upload.answer());
            }
            case "TRUE_FALSE" -> data.put("correctAnswer", upload.answer());
            case "FILL_IN_BLANK" -> data.put("acceptedAnswers", upload.answer());
            default -> throw new IllegalStateException("Unreachable: type already validated as " + upload.type());
        }
        return data;
    }


    private QuestionDataset findOrCreateDataset(DatasetMeta meta) {
        return datasetRepository.findByNameAndVersion(meta.name(), meta.version())
                .orElseGet(() -> datasetRepository.save(
                        QuestionDataset.builder()
                                .name(meta.name())
                                .version(meta.version())
                                .build()));
    }

    private Topic resolveTopic(DatasetUploadRequest request, String name) {
        if (request.subjectId() != null) {
            return catalogService.findOrCreateTopicInSubject(request.subjectId(), name);
        }
        return catalogService.findOrCreateTopicByName(name);
    }

    private String describeTarget(DatasetUploadRequest request, Topic fixedTopic) {
        if (fixedTopic != null) {
            String subject = fixedTopic.getSubject() == null ? null : fixedTopic.getSubject().getName();
            return subject == null ? fixedTopic.getName() : subject + " > " + fixedTopic.getName();
        }
        return request.subjectId() != null ? "topics from the file" : "topics from the file (any subject)";
    }

    @Transactional(readOnly = true)
    public List<DatasetSummary> listDatasets() {
        Map<UUID, long[]> counts = new HashMap<>();
        for (Object[] row : questionRepository.countPerDataset()) {
            counts.put((UUID) row[0], new long[]{(Long) row[1], (Long) row[2]});
        }
        Map<UUID, List<DatasetTopicRef>> topics = new HashMap<>();
        for (Object[] row : questionRepository.countPerDatasetAndTopic()) {
            topics.computeIfAbsent((UUID) row[0], k -> new java.util.ArrayList<>())
                    .add(new DatasetTopicRef((UUID) row[1], (String) row[2], (UUID) row[3], (String) row[4], (Long) row[5]));
        }
        return datasetRepository.findAllByOrderByImportedAtDesc().stream()
                .map(d -> {
                    long[] c = counts.getOrDefault(d.getId(), new long[]{0, 0});
                    return DatasetSummary.from(d, c[0], c[1], topics.getOrDefault(d.getId(), List.of()));
                })
                .toList();
    }
}
