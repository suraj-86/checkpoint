package com.checkpoint.admin.service;

import com.checkpoint.admin.dto.DatasetMeta;
import com.checkpoint.admin.dto.DatasetUploadRequest;
import com.checkpoint.admin.dto.ImportResponse;
import com.checkpoint.admin.dto.QuestionUpload;
import com.checkpoint.admin.dto.ValidationResponse;
import com.checkpoint.admin.validation.QuestionValidator;
import com.checkpoint.catalog.entity.Subject;
import com.checkpoint.catalog.service.CatalogService;
import com.checkpoint.question.entity.Question;
import com.checkpoint.question.entity.QuestionDataset;
import com.checkpoint.question.repository.QuestionDatasetRepository;
import com.checkpoint.question.repository.QuestionRepository;
import com.checkpoint.topic.entity.Topic;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DatasetImportServiceTest {

    @Mock
    private QuestionValidator validator;
    @Mock
    private QuestionDatasetRepository datasetRepository;
    @Mock
    private QuestionRepository questionRepository;
    @Mock
    private CatalogService catalogService;

    private DatasetImportService service;

    @BeforeEach
    void setUp() {
        service = new DatasetImportService(validator, datasetRepository, questionRepository, catalogService);
        when(validator.validate(any())).thenReturn(new ValidationResponse("Set", "1", 2, 2, 0, List.of(), List.of()));
        when(datasetRepository.findByNameAndVersion("Set", "1")).thenReturn(Optional.of(QuestionDataset.builder().name("Set").version("1").build()));
        when(questionRepository.findFirstByExternalId(any())).thenReturn(Optional.empty());
    }

    private static QuestionUpload question(String id, String topic) {
        return new QuestionUpload(id, topic, null, "TRUE_FALSE", "EASY", "Is 2 even?", null, Boolean.TRUE, "Yes.");
    }

    @Test
    void everyQuestionGoesIntoTheChosenTopicAndFileTopicsAreIgnored() {
        UUID topicId = UUID.randomUUID();
        Subject maths = Subject.builder().id(UUID.randomUUID()).name("Maths").build();
        Topic sets = Topic.builder().id(topicId).name("Sets").subject(maths).build();
        when(catalogService.requireTopic(topicId)).thenReturn(sets);

        ImportResponse response = service.importDataset(new DatasetUploadRequest(
                new DatasetMeta("Set", "1", null), List.of(question("Q1", "Java"), question("Q2", "Other")), topicId, null));

        ArgumentCaptor<Question> saved = ArgumentCaptor.forClass(Question.class);
        verify(questionRepository, times(2)).save(saved.capture());
        assertThat(saved.getAllValues()).allSatisfy(q -> assertThat(q.getTopic()).isSameAs(sets));
        assertThat(response.created()).isEqualTo(2);
        assertThat(response.target()).isEqualTo("Maths > Sets");
        verify(catalogService, never()).findOrCreateTopicInSubject(any(), any());
    }

    @Test
    void fileTopicsAreResolvedInsideTheChosenSubject() {
        UUID subjectId = UUID.randomUUID();
        Topic streams = Topic.builder().id(UUID.randomUUID()).name("Streams").build();
        Topic generics = Topic.builder().id(UUID.randomUUID()).name("Generics").build();
        when(catalogService.findOrCreateTopicInSubject(subjectId, "Streams")).thenReturn(streams);
        when(catalogService.findOrCreateTopicInSubject(subjectId, "Generics")).thenReturn(generics);

        ImportResponse response = service.importDataset(new DatasetUploadRequest(
                new DatasetMeta("Set", "1", null), List.of(question("Q1", "Streams"), question("Q2", "Generics")), null, subjectId));

        ArgumentCaptor<Question> saved = ArgumentCaptor.forClass(Question.class);
        verify(questionRepository, times(2)).save(saved.capture());
        assertThat(saved.getAllValues().get(0).getTopic()).isSameAs(streams);
        assertThat(saved.getAllValues().get(1).getTopic()).isSameAs(generics);
        assertThat(response.target()).isEqualTo("topics from the file");
    }
}
