package com.checkpoint.preference.service;

import com.checkpoint.catalog.entity.Subject;
import com.checkpoint.catalog.repository.ExamRepository;
import com.checkpoint.catalog.repository.StreamRepository;
import com.checkpoint.catalog.repository.SubjectRepository;
import com.checkpoint.common.exception.BadRequestException;
import com.checkpoint.preference.dto.PreferencesResponse;
import com.checkpoint.preference.repository.UserPreferenceRepository;
import com.checkpoint.user.entity.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PreferenceServiceTest {

    @Mock
    private UserPreferenceRepository repository;
    @Mock
    private StreamRepository streamRepository;
    @Mock
    private ExamRepository examRepository;
    @Mock
    private SubjectRepository subjectRepository;

    private final User user = User.builder().id(UUID.randomUUID()).username("student").build();

    private PreferenceService service() {
        return new PreferenceService(repository, streamRepository, examRepository, subjectRepository);
    }

    @Test
    void replaceSavesStreamExamAndDistinctSubjects() {
        UUID stream = UUID.randomUUID();
        UUID exam = UUID.randomUUID();
        UUID a = UUID.randomUUID();
        UUID b = UUID.randomUUID();
        when(streamRepository.existsById(stream)).thenReturn(true);
        when(examRepository.existsById(exam)).thenReturn(true);
        when(subjectRepository.findAllById(any())).thenReturn(List.of(
                Subject.builder().id(a).name("A").build(), Subject.builder().id(b).name("B").build()));

        PreferencesResponse response = service().replace(user, stream, exam, List.of(a, b, a));

        assertThat(response.subjectIds()).containsExactly(a, b);
        assertThat(response.streamId()).isEqualTo(stream);
        verify(repository).replace(eq(user.getId()), eq(stream), eq(exam), any());
    }

    @Test
    void replaceRejectsUnknownSubjects() {
        UUID a = UUID.randomUUID();
        when(subjectRepository.findAllById(any())).thenReturn(List.of());

        assertThatThrownBy(() -> service().replace(user, null, null, List.of(a))).isInstanceOf(BadRequestException.class);
        verify(repository, never()).replace(any(), any(), any(), any());
    }

    @Test
    void replaceRejectsUnknownStream() {
        UUID stream = UUID.randomUUID();
        when(streamRepository.existsById(stream)).thenReturn(false);

        assertThatThrownBy(() -> service().replace(user, stream, null, List.of())).isInstanceOf(BadRequestException.class);
    }

    @Test
    void emptyPreferencesAreAllowedAndClearEverything() {
        PreferencesResponse response = service().replace(user, null, null, null);

        assertThat(response.streamId()).isNull();
        assertThat(response.subjectIds()).isEmpty();
        verify(repository).replace(eq(user.getId()), eq(null), eq(null), any());
    }
}
