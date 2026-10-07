package com.checkpoint.admin.validation;

import com.checkpoint.admin.dto.DatasetUploadRequest;
import com.checkpoint.admin.dto.QuestionUpload;
import com.checkpoint.admin.dto.QuestionValidationError;
import com.checkpoint.admin.dto.ValidationResponse;
import com.checkpoint.question.entity.Difficulty;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.*;

@Component
public class QuestionValidator {

    private static final Set<String> VALID_TYPES = Set.of("MCQ", "TRUE_FALSE", "FILL_IN_BLANK");
    private static final int MCQ_OPTION_COUNT = 4;
    private static final int MAX_DATASET_NAME = 150;
    private static final int MAX_DATASET_VERSION = 50;
    private static final int MAX_EXTERNAL_ID = 100;
    private static final int MAX_TOPIC = 100;
    private static final int MAX_SUBTOPIC = 100;

    public ValidationResponse validate(DatasetUploadRequest request) {
        List<QuestionUpload> questions = request.questions() == null ? List.of() : request.questions();

        List<String> datasetErrors = validateDataset(request, questions);

        List<QuestionValidationError> errors = new ArrayList<>();
        Set<String> seenExternalIds = new HashSet<>();
        Set<String> duplicateExternalIds = new HashSet<>();

        for (QuestionUpload q : questions) {
            if (StringUtils.hasText(q.externalId()) && !seenExternalIds.add(q.externalId())) {
                duplicateExternalIds.add(q.externalId());
            }
        }

        for (QuestionUpload q : questions) {
            List<String> messages = new ArrayList<>();
            validateOne(q, messages);

            if (StringUtils.hasText(q.externalId()) && duplicateExternalIds.contains(q.externalId())) {
                messages.add("Duplicate externalId within this dataset upload.");
            }

            if (!messages.isEmpty()) {
                String label = StringUtils.hasText(q.externalId()) ? q.externalId() : "(missing externalId)";
                errors.add(new QuestionValidationError(label, messages));
            }
        }

        int total = questions.size();
        int invalid = errors.size();

        return new ValidationResponse(
                request.dataset() != null ? request.dataset().name() : null,
                request.dataset() != null ? request.dataset().version() : null,
                total,
                total - invalid,
                invalid,
                datasetErrors,
                errors
        );
    }

    private List<String> validateDataset(DatasetUploadRequest request, List<QuestionUpload> questions) {
        List<String> problems = new ArrayList<>();

        if (request.dataset() == null) {
            problems.add("The 'dataset' section (name and version) is missing.");
        } else {
            String name = request.dataset().name();
            String version = request.dataset().version();

            if (!StringUtils.hasText(name)) {
                problems.add("Dataset name is required.");
            } else if (name.length() > MAX_DATASET_NAME) {
                problems.add("Dataset name is too long (max " + MAX_DATASET_NAME + " characters).");
            }

            if (!StringUtils.hasText(version)) {
                problems.add("Dataset version is required.");
            } else if (version.length() > MAX_DATASET_VERSION) {
                problems.add("Dataset version is too long (max " + MAX_DATASET_VERSION + " characters).");
            }
        }

        if (questions.isEmpty()) {
            problems.add("The dataset contains no questions.");
        }

        return problems;
    }

    private void validateOne(QuestionUpload q, List<String> messages) {
        if (!StringUtils.hasText(q.externalId())) {
            messages.add("externalId is required.");
        }
        if (StringUtils.hasText(q.externalId()) && q.externalId().length() > MAX_EXTERNAL_ID) {
            messages.add("externalId is too long (max " + MAX_EXTERNAL_ID + " characters).");
        }
        if (!StringUtils.hasText(q.topic())) {
            messages.add("topic is required.");
        } else if (q.topic().length() > MAX_TOPIC) {
            messages.add("topic is too long (max " + MAX_TOPIC + " characters).");
        }
        if (q.subtopic() != null && q.subtopic().length() > MAX_SUBTOPIC) {
            messages.add("subtopic is too long (max " + MAX_SUBTOPIC + " characters).");
        }
        if (!StringUtils.hasText(q.question())) {
            messages.add("Question text is required.");
        }
        if (!StringUtils.hasText(q.explanation())) {
            messages.add("Explanation is missing.");
        }

        if (!StringUtils.hasText(q.difficulty())) {
            messages.add("Difficulty is required.");
        } else {
            try {
                Difficulty.valueOf(q.difficulty());
            } catch (IllegalArgumentException e) {
                messages.add("Difficulty is invalid: '" + q.difficulty() + "'. Must be one of EASY, MEDIUM, HARD, EXPERT.");
            }
        }

        if (!StringUtils.hasText(q.type())) {
            messages.add("Question type is required.");
            return;
        }
        if (!VALID_TYPES.contains(q.type())) {
            messages.add("Question type is invalid: '" + q.type() + "'. Must be one of MCQ, TRUE_FALSE, FILL_IN_BLANK.");
            return;
        }

        switch (q.type()) {
            case "MCQ" -> validateMcq(q, messages);
            case "TRUE_FALSE" -> validateTrueFalse(q, messages);
            case "FILL_IN_BLANK" -> validateFillInBlank(q, messages);
        }
    }

    private void validateMcq(QuestionUpload q, List<String> messages) {
        List<String> options = q.options();

        if (options == null || options.size() != MCQ_OPTION_COUNT) {
            int actual = options == null ? 0 : options.size();
            messages.add("MCQ must contain exactly four options (found " + actual + ").");
            return;
        }

        long blankOptions = options.stream().filter(o -> !StringUtils.hasText(o)).count();
        if (blankOptions > 0) {
            messages.add("MCQ options must not be blank.");
        }

        long distinctOptions = options.stream().map(String::trim).distinct().count();
        if (distinctOptions != options.size()) {
            messages.add("MCQ options must be unique (found duplicate options, which would allow two correct answers).");
        }

        if (!(q.answer() instanceof String answer) || !StringUtils.hasText(answer)) {
            messages.add("MCQ answer is required and must be a single string.");
            return;
        }

        boolean matches = options.stream().anyMatch(o -> o != null && o.trim().equals(answer.trim()));
        if (!matches) {
            messages.add("MCQ answer '" + answer + "' does not match any of the provided options.");
        }
    }

    private void validateTrueFalse(QuestionUpload q, List<String> messages) {
        if (!(q.answer() instanceof Boolean)) {
            messages.add("TRUE_FALSE answer must be a boolean (true or false).");
        }
    }

    private void validateFillInBlank(QuestionUpload q, List<String> messages) {
        if (!(q.answer() instanceof List<?> answers) || answers.isEmpty()) {
            messages.add("FILL_IN_BLANK answer must be a non-empty list of accepted strings.");
            return;
        }
        boolean anyBlank = answers.stream().anyMatch(a -> !(a instanceof String s) || !StringUtils.hasText(s));
        if (anyBlank) {
            messages.add("FILL_IN_BLANK accepted answers must all be non-blank strings.");
        }
    }
}
