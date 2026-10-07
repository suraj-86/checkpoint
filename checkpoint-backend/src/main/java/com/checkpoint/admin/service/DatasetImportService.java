package com.checkpoint.admin.service;

import com.checkpoint.admin.dto.*;
import com.checkpoint.admin.validation.QuestionValidator;
import com.checkpoint.common.exception.DatasetValidationException;
import com.checkpoint.question.entity.Difficulty;
import com.checkpoint.question.entity.Question;
import com.checkpoint.question.entity.QuestionDataset;
import com.checkpoint.question.util.QuestionTypeCodec;
import com.checkpoint.question.repository.QuestionDatasetRepository;
import com.checkpoint.question.repository.QuestionRepository;
import com.checkpoint.topic.entity.Topic;
import com.checkpoint.topic.repository.TopicRepository;
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

    public ValidationResponse validate(DatasetUploadRequest request) {
        return validator.validate(request);
    }

    @Transactional
    public ImportResponse importDataset(DatasetUploadRequest request) {
        ValidationResponse validation = validator.validate(request);
        if (!validation.allValid()) {
            throw new DatasetValidationException(validation);
        }

        QuestionDataset dataset = findOrCreateDataset(request.dataset());

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

    private Topic findOrCreateTopic(String name) {
        return topicRepository.findByName(name)
                .orElseGet(() -> topicRepository.save(Topic.builder().name(name).build()));
    }

    @Transactional(readOnly = true)
    public List<DatasetSummary> listDatasets() {
        Map<UUID, long[]> counts = new HashMap<>();
        for (Object[] row : questionRepository.countPerDataset()) {
            counts.put((UUID) row[0], new long[]{(Long) row[1], (Long) row[2]});
        }
        return datasetRepository.findAllByOrderByImportedAtDesc().stream()
                .map(d -> {
                    long[] c = counts.getOrDefault(d.getId(), new long[]{0, 0});
                    return DatasetSummary.from(d, c[0], c[1]);
                })
                .toList();
    }
}
