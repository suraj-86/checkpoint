package com.checkpoint.catalog.service;

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
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CatalogServiceTest {

    @Mock
    private StreamRepository streamRepository;
    @Mock
    private SubjectRepository subjectRepository;
    @Mock
    private ExamRepository examRepository;
    @Mock
    private TopicRepository topicRepository;
    @Mock
    private QuestionRepository questionRepository;

    private CatalogService service;

    @BeforeEach
    void setUp() {
        service = new CatalogService(streamRepository, subjectRepository, examRepository, topicRepository, questionRepository);
        lenient().when(subjectRepository.findAllByOrderBySortOrderAscNameAsc()).thenReturn(List.of());
        lenient().when(streamRepository.findAllByOrderBySortOrderAscNameAsc()).thenReturn(List.of());
        lenient().when(examRepository.findAllByOrderBySortOrderAscNameAsc()).thenReturn(List.of());
        lenient().when(questionRepository.countPerTopic()).thenReturn(List.of());
        lenient().when(topicRepository.findAll()).thenReturn(List.of());
    }

    private static SubjectRequest subjectRequest(String name, List<UUID> streams, List<UUID> exams) {
        return new SubjectRequest(name, null, null, null, streams, exams);
    }

    @Test
    void cleanNameTrimsAndCollapsesSpaces() {
        assertThat(CatalogService.cleanName("  Applied    Maths ")).isEqualTo("Applied Maths");
    }

    @Test
    void createSubjectRejectsDuplicateNameIgnoringCase() {
        when(subjectRepository.existsByNameIgnoreCase("Maths")).thenReturn(true);

        assertThatThrownBy(() -> service.createSubject(subjectRequest("Maths", null, null)))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("already exists");
        verify(subjectRepository, never()).save(any());
    }

    @Test
    void createSubjectLinksStreamsAndExams() {
        UUID streamId = UUID.randomUUID();
        UUID examId = UUID.randomUUID();
        Stream stream = Stream.builder().id(streamId).name("Science (PCM)").build();
        Exam exam = Exam.builder().id(examId).name("JEE").build();
        when(subjectRepository.existsByNameIgnoreCase("Maths")).thenReturn(false);
        when(streamRepository.findAllById(any())).thenReturn(List.of(stream));
        when(examRepository.findAllById(any())).thenReturn(List.of(exam));

        service.createSubject(subjectRequest("  Maths ", List.of(streamId, streamId), List.of(examId)));

        ArgumentCaptor<Subject> captor = ArgumentCaptor.forClass(Subject.class);
        verify(subjectRepository).save(captor.capture());
        Subject saved = captor.getValue();
        assertThat(saved.getName()).isEqualTo("Maths");
        assertThat(saved.getStreams()).containsExactly(stream);
        assertThat(saved.getExams()).containsExactly(exam);
        assertThat(saved.isActive()).isTrue();
    }

    @Test
    void createSubjectRejectsUnknownStream() {
        when(subjectRepository.existsByNameIgnoreCase("Maths")).thenReturn(false);
        when(streamRepository.findAllById(any())).thenReturn(List.of());

        assertThatThrownBy(() -> service.createSubject(subjectRequest("Maths", List.of(UUID.randomUUID()), null)))
                .isInstanceOf(BadRequestException.class);
        verify(subjectRepository, never()).save(any());
    }

    @Test
    void updateSubjectKeepsLinksWhenNotSent() {
        UUID id = UUID.randomUUID();
        Stream stream = Stream.builder().id(UUID.randomUUID()).name("Commerce").build();
        Subject subject = Subject.builder().id(id).name("Maths").build();
        subject.getStreams().add(stream);
        when(subjectRepository.findById(id)).thenReturn(Optional.of(subject));
        when(subjectRepository.existsByNameIgnoreCaseAndIdNot("Maths", id)).thenReturn(false);

        service.updateSubject(id, subjectRequest("Maths", null, null));

        assertThat(subject.getStreams()).containsExactly(stream);
    }

    @Test
    void updateUnknownSubjectIsNotFound() {
        UUID id = UUID.randomUUID();
        when(subjectRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.updateSubject(id, subjectRequest("Maths", null, null)))
                .isInstanceOf(NotFoundException.class);
    }

    @Test
    void deleteSubjectIsBlockedWhileItHasQuestions() {
        UUID id = UUID.randomUUID();
        UUID topicId = UUID.randomUUID();
        Subject subject = Subject.builder().id(id).name("Java").build();
        Topic topic = Topic.builder().id(topicId).name("Java").subject(subject).build();
        when(subjectRepository.findById(id)).thenReturn(Optional.of(subject));
        when(topicRepository.findBySubjectId(id)).thenReturn(List.of(topic));
        when(questionRepository.countByTopicId(topicId)).thenReturn(12L);

        assertThatThrownBy(() -> service.deleteSubject(id))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("12");
        verify(subjectRepository, never()).delete(any());
        verify(topicRepository, never()).deleteAll(any());
    }

    @Test
    void deleteSubjectRemovesEmptyTopicsAndTheSubject() {
        UUID id = UUID.randomUUID();
        UUID topicId = UUID.randomUUID();
        Subject subject = Subject.builder().id(id).name("Maths").build();
        Topic topic = Topic.builder().id(topicId).name("Sets").subject(subject).build();
        when(subjectRepository.findById(id)).thenReturn(Optional.of(subject));
        when(topicRepository.findBySubjectId(id)).thenReturn(List.of(topic));
        when(questionRepository.countByTopicId(topicId)).thenReturn(0L);

        service.deleteSubject(id);

        verify(topicRepository).deleteAll(List.of(topic));
        verify(subjectRepository).delete(subject);
    }

    @Test
    void deleteTopicIsBlockedWhileItHasQuestions() {
        UUID id = UUID.randomUUID();
        when(topicRepository.findById(id)).thenReturn(Optional.of(Topic.builder().id(id).name("Sets").build()));
        when(questionRepository.countByTopicId(id)).thenReturn(3L);

        assertThatThrownBy(() -> service.deleteTopic(id)).isInstanceOf(ConflictException.class);
        verify(topicRepository, never()).delete(any());
    }

    @Test
    void createTopicRejectsNameUsedAnywhereInTheCatalog() {
        UUID subjectId = UUID.randomUUID();
        when(subjectRepository.findById(subjectId)).thenReturn(Optional.of(Subject.builder().id(subjectId).name("Maths").build()));
        when(topicRepository.existsByNameIgnoreCase("Sets")).thenReturn(true);

        assertThatThrownBy(() -> service.createTopic(subjectId, new TopicRequest("Sets", null, null)))
                .isInstanceOf(ConflictException.class);
        verify(topicRepository, never()).save(any());
    }

    @Test
    void createStreamRejectsDuplicateName() {
        when(streamRepository.existsByNameIgnoreCase("Commerce")).thenReturn(true);

        assertThatThrownBy(() -> service.createStream(new NamedItemRequest("Commerce", null, null, null)))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void findOrCreateTopicReturnsExistingTopic() {
        Topic existing = Topic.builder().id(UUID.randomUUID()).name("Java").build();
        when(topicRepository.findByName("Java")).thenReturn(Optional.of(existing));

        assertThat(service.findOrCreateTopicByName("Java")).isSameAs(existing);
        verify(subjectRepository, never()).save(any());
    }

    @Test
    void findOrCreateTopicCreatesSubjectInTheDefaultStream() {
        Stream defaultStream = Stream.builder().id(UUID.randomUUID()).name(CatalogService.DEFAULT_STREAM_NAME).build();
        when(topicRepository.findByName("Rust")).thenReturn(Optional.empty());
        when(subjectRepository.findByNameIgnoreCase("Rust")).thenReturn(Optional.empty());
        when(streamRepository.findByNameIgnoreCase(CatalogService.DEFAULT_STREAM_NAME)).thenReturn(Optional.of(defaultStream));
        when(subjectRepository.save(any(Subject.class))).thenAnswer(inv -> inv.getArgument(0));
        when(topicRepository.save(any(Topic.class))).thenAnswer(inv -> inv.getArgument(0));

        Topic created = service.findOrCreateTopicByName("Rust");

        assertThat(created.getName()).isEqualTo("Rust");
        assertThat(created.getSubject().getName()).isEqualTo("Rust");
        assertThat(created.getSubject().getStreams()).containsExactly(defaultStream);
    }
}
