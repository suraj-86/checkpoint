package com.checkpoint.admin.service;

import com.checkpoint.admin.dto.SubtopicOrganiseDtos.Move;
import com.checkpoint.admin.dto.SubtopicOrganiseDtos.OrganiseResult;
import com.checkpoint.admin.dto.SubtopicOrganiseDtos.Preview;
import com.checkpoint.catalog.entity.Subject;
import com.checkpoint.catalog.repository.SubjectRepository;
import com.checkpoint.catalog.service.CatalogService;
import com.checkpoint.common.exception.BadRequestException;
import com.checkpoint.question.repository.QuestionOrganiseRepository;
import com.checkpoint.topic.entity.Topic;
import com.checkpoint.topic.repository.TopicRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class SubtopicOrganiseServiceTest {

    @Mock
    private SubjectRepository subjectRepository;
    @Mock
    private TopicRepository topicRepository;
    @Mock
    private QuestionOrganiseRepository questionRepository;
    @Mock
    private CatalogService catalogService;

    private SubtopicOrganiseService service;
    private final UUID subjectId = UUID.randomUUID();
    private final Topic general = Topic.builder().id(UUID.randomUUID()).name("General").build();

    @BeforeEach
    void setUp() {
        service = new SubtopicOrganiseService(subjectRepository, topicRepository, questionRepository, catalogService);
        when(subjectRepository.findById(subjectId)).thenReturn(Optional.of(Subject.builder().name("Java").build()));
        when(topicRepository.findBySubjectId(subjectId)).thenReturn(List.of(general));
    }

    @Test
    void previewMergesSpellingsAndCountsQuestionsWithoutSubtopic() {
        when(questionRepository.countByTopicId(general.getId())).thenReturn(30L);
        when(questionRepository.countBySubtopic(general.getId())).thenReturn(List.of(
                new Object[]{"OOP", 10L},
                new Object[]{"oop", 5L},
                new Object[]{"Collections", 12L}
        ));

        Preview preview = service.preview(subjectId);

        assertThat(preview.generalQuestions()).isEqualTo(30);
        assertThat(preview.withoutSubtopic()).isEqualTo(3);
        assertThat(preview.subtopics()).hasSize(2);
        assertThat(preview.subtopics().get(0).key()).isEqualTo("oop");
        assertThat(preview.subtopics().get(0).count()).isEqualTo(15);
        assertThat(preview.subtopics().get(0).label()).isEqualTo("OOP");
    }

    @Test
    void organiseMovesQuestionsAndReportsNewTopics() {
        Topic collections = Topic.builder().id(UUID.randomUUID()).name("Collections").build();
        when(catalogService.findOrCreateTopicInSubject(subjectId, "Collections")).thenReturn(collections);
        when(questionRepository.moveBySubtopic(general.getId(), collections, "collections")).thenReturn(12);

        OrganiseResult result = service.organise(subjectId, List.of(new Move("Collections", "Collections")));

        assertThat(result.moved()).isEqualTo(12);
        assertThat(result.topicsCreated()).containsExactly("Collections");
    }

    @Test
    void movingIntoAnExistingTopicIsNotReportedAsCreated() {
        Topic oop = Topic.builder().id(UUID.randomUUID()).name("OOP").build();
        when(topicRepository.findBySubjectId(subjectId)).thenReturn(List.of(general, oop));
        when(catalogService.findOrCreateTopicInSubject(subjectId, "OOP")).thenReturn(oop);
        when(questionRepository.moveBySubtopic(any(), any(), any())).thenReturn(4);

        OrganiseResult result = service.organise(subjectId, List.of(new Move("oop", "OOP")));

        assertThat(result.topicsCreated()).isEmpty();
        assertThat(result.moved()).isEqualTo(4);
    }

    @Test
    void movingIntoGeneralDoesNothing() {
        OrganiseResult result = service.organise(subjectId, List.of(new Move("misc", "general")));

        assertThat(result.moved()).isZero();
        verify(questionRepository, never()).moveBySubtopic(any(), any(), any());
    }

    @Test
    void emptyMovesAreRejected() {
        assertThatThrownBy(() -> service.organise(subjectId, List.of())).isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> service.organise(subjectId, List.of(new Move(" ", "X")))).isInstanceOf(BadRequestException.class);
        verify(catalogService, never()).findOrCreateTopicInSubject(eq(subjectId), any());
    }
}
