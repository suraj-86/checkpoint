package com.checkpoint.admin.service;

import com.checkpoint.admin.dto.*;
import com.checkpoint.admin.validation.QuestionValidator;
import com.checkpoint.common.exception.DatasetValidationException;
import com.checkpoint.question.entity.Difficulty;
import com.checkpoint.question.entity.Question;
import com.checkpoint.question.entity.QuestionDataset;
import com.checkpoint.question.entity.QuestionType;
import com.checkpoint.question.repository.QuestionDatasetRepository;
import com.checkpoint.question.repository.QuestionRepository;
import com.checkpoint.topic.entity.Topic;
import com.checkpoint.topic.repository.TopicRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class DatasetImportService {

    private final QuestionValidator validator;
    private final QuestionDatasetRepository datasetRepository;
    private final QuestionRepository questionRepository;
    private final TopicRepository topicRepository;

    public DatasetImportService(
            QuestionValidator validator,
            QuestionDatasetRepository datasetRepository,
            QuestionRepository questionRepository,
            TopicRepository topicRepository
    ) {
        this.validator = validator;
        this.datasetRepository = datasetRepository;
        this.questionRepository = questionRepository;
        this.topicRepository = topicRepository;
    }

    /** POST /api/admin/datasets/validate — read-only, never touches the database. */
    public ValidationResponse validate(DatasetUploadRequest request) {
        return validator.validate(request);
    }

    /**
     * POST /api/admin/datasets/import.
     *
     * Per docs/07-Question-and-Dataset-Specification.md section 8/9: the
     * server validates again (never trusts a prior validate call), and the
     * whole import is one transaction — one invalid question anywhere in
     * the file means zero questions are imported, not a partial import.
     */
    @Transactional
    public ImportResponse importDataset(DatasetUploadRequest request) {
        ValidationResponse validation = validator.validate(request);
        if (!validation.allValid()) {
            throw new DatasetValidationException(validation);
        }

        QuestionDataset dataset = findOrCreateDataset(request.dataset());

        // Cache topic lookups within this import so we don't hit the DB
        // once per question for repeated topic names.
        Map<String, Topic> topicCache = new HashMap<>();

        int created = 0;
        int updated = 0;

        for (QuestionUpload upload : request.questions()) {
            Topic topic = topicCache.computeIfAbsent(upload.topic(), this::findOrCreateTopic);

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
                updated
        );
    }

    private void applyUpload(Question question, QuestionUpload upload, QuestionDataset dataset, Topic topic) {
        question.setDataset(dataset);
        question.setTopic(topic);
        question.setSubtopic(upload.subtopic());
        question.setQuestionType(mapType(upload.type()));
        question.setDifficulty(Difficulty.valueOf(upload.difficulty()));
        question.setQuestionText(upload.question());
        question.setAnswerData(buildAnswerData(upload));
        question.setExplanation(upload.explanation());
        // Deliberately does NOT touch `active` — re-importing/updating a
        // question must not silently un-retire it (docs section 12: only
        // an explicit admin restore action does that).
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

    private QuestionType mapType(String jsonType) {
        return switch (jsonType) {
            case "MCQ" -> QuestionType.MULTIPLE_CHOICE;
            case "TRUE_FALSE" -> QuestionType.TRUE_FALSE;
            case "FILL_IN_BLANK" -> QuestionType.FILL_IN_BLANK;
            default -> throw new IllegalStateException("Unreachable: type already validated as " + jsonType);
        };
    }

    private QuestionDataset findOrCreateDataset(DatasetMeta meta) {
        return datasetRepository.findByNameAndVersion(meta.name(), meta.version())
                .orElseGet(() -> datasetRepository.save(
                        QuestionDataset.builder()
                                .name(meta.name())
                                .version(meta.version())
                                .build()));
    }

    private Topic findOrCreateTopic(String name) {
        return topicRepository.findByName(name)
                .orElseGet(() -> topicRepository.save(Topic.builder().name(name).build()));
    }

    public List<DatasetSummary> listDatasets() {
        return datasetRepository.findAll().stream().map(DatasetSummary::from).toList();
    }
}
