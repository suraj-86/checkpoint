package com.checkpoint.admin.validation;

import com.checkpoint.admin.dto.DatasetMeta;
import com.checkpoint.admin.dto.DatasetUploadRequest;
import com.checkpoint.admin.dto.QuestionUpload;
import com.checkpoint.admin.dto.ValidationResponse;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class QuestionValidatorTest {

    private final QuestionValidator validator = new QuestionValidator();

    private static QuestionUpload validMcq(String externalId) {
        return new QuestionUpload(
                externalId, "Java", "OOP", "MCQ", "EASY", "Which keyword inherits a class?",
                List.of("extends", "implements", "inherits", "super"), "extends", "extends is used for inheritance.");
    }

    private static DatasetUploadRequest request(DatasetMeta meta, List<QuestionUpload> questions) {
        return new DatasetUploadRequest(meta, questions);
    }

    @Test
    void validDatasetHasNoErrors() {
        ValidationResponse r = validator.validate(
                request(new DatasetMeta("Java Core", "1.0", null), List.of(validMcq("A-1"), validMcq("A-2"))));

        assertThat(r.allValid()).isTrue();
        assertThat(r.total()).isEqualTo(2);
        assertThat(r.validCount()).isEqualTo(2);
        assertThat(r.datasetErrors()).isEmpty();
    }

    @Test
    void missingDatasetSectionIsReported() {
        ValidationResponse r = validator.validate(request(null, List.of(validMcq("A-1"))));

        assertThat(r.allValid()).isFalse();
        assertThat(r.datasetErrors()).hasSize(1);
        assertThat(r.invalidCount()).isZero();
    }

    @Test
    void blankNameAndVersionAreReported() {
        ValidationResponse r = validator.validate(
                request(new DatasetMeta(" ", "", null), List.of(validMcq("A-1"))));

        assertThat(r.allValid()).isFalse();
        assertThat(r.datasetErrors()).hasSize(2);
    }

    @Test
    void overlongNameAndVersionAreReported() {
        ValidationResponse r = validator.validate(
                request(new DatasetMeta("n".repeat(151), "v".repeat(51), null), List.of(validMcq("A-1"))));

        assertThat(r.datasetErrors()).hasSize(2);
    }

    @Test
    void emptyQuestionListIsRejected() {
        ValidationResponse r = validator.validate(request(new DatasetMeta("Java Core", "1.0", null), List.of()));

        assertThat(r.allValid()).isFalse();
        assertThat(r.datasetErrors()).containsExactly("The dataset contains no questions.");
    }

    @Test
    void nullQuestionListIsRejectedWithoutThrowing() {
        ValidationResponse r = validator.validate(request(new DatasetMeta("Java Core", "1.0", null), null));

        assertThat(r.allValid()).isFalse();
        assertThat(r.total()).isZero();
    }

    @Test
    void invalidQuestionsAreCountedSeparatelyFromDatasetErrors() {
        QuestionUpload bad = new QuestionUpload(
                "A-2", "Java", "OOP", "MCQ", "EASY", "Q?", List.of("a", "b"), "a", "Because.");

        ValidationResponse r = validator.validate(
                request(new DatasetMeta("Java Core", "1.0", null), List.of(validMcq("A-1"), bad)));

        assertThat(r.allValid()).isFalse();
        assertThat(r.total()).isEqualTo(2);
        assertThat(r.validCount()).isEqualTo(1);
        assertThat(r.invalidCount()).isEqualTo(1);
        assertThat(r.datasetErrors()).isEmpty();
        assertThat(r.errors().get(0).externalId()).isEqualTo("A-2");
    }

    @Test
    void duplicateExternalIdsAreFlagged() {
        ValidationResponse r = validator.validate(
                request(new DatasetMeta("Java Core", "1.0", null), List.of(validMcq("A-1"), validMcq("A-1"))));

        assertThat(r.invalidCount()).isEqualTo(2);
    }

    @Test
    void overlongExternalIdTopicAndSubtopicAreFlagged() {
        QuestionUpload q = new QuestionUpload(
                "x".repeat(101), "t".repeat(101), "s".repeat(101), "TRUE_FALSE", "EASY", "Q?", null, true, "Because.");

        ValidationResponse r = validator.validate(request(new DatasetMeta("Java Core", "1.0", null), List.of(q)));

        assertThat(r.invalidCount()).isEqualTo(1);
        assertThat(r.errors().get(0).messages()).hasSize(3);
    }
}
