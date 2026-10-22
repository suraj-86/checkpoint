package com.checkpoint.admin.service;

import com.checkpoint.admin.dto.TopicMergeDtos.MergeRequest;
import com.checkpoint.common.exception.BadRequestException;
import com.checkpoint.common.exception.NotFoundException;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class TopicMergeServiceTest {

    private final JdbcTemplate jdbc = mock(JdbcTemplate.class);
    private final TopicMergeService service = new TopicMergeService(jdbc);

    @Test
    void rejectsMissingTarget() {
        assertThrows(BadRequestException.class, () -> service.merge(new MergeRequest(null, List.of(UUID.randomUUID()), null)));
        verifyNoInteractions(jdbc);
    }

    @Test
    void rejectsEmptySources() {
        assertThrows(BadRequestException.class, () -> service.merge(new MergeRequest(UUID.randomUUID(), List.of(), null)));
        verifyNoInteractions(jdbc);
    }

    @Test
    void rejectsTargetAmongSources() {
        UUID id = UUID.randomUUID();
        assertThrows(BadRequestException.class, () -> service.merge(new MergeRequest(id, List.of(id), null)));
        verifyNoInteractions(jdbc);
    }

    @Test
    void rejectsUnknownTarget() {
        when(jdbc.queryForList(any(String.class), eq(UUID.class), any(Object.class))).thenReturn(List.of());
        assertThrows(NotFoundException.class, () -> service.merge(new MergeRequest(UUID.randomUUID(), List.of(UUID.randomUUID()), null)));
    }

    @Test
    void rejectsTopicsFromAnotherSubject() {
        UUID target = UUID.randomUUID();
        UUID source = UUID.randomUUID();
        UUID subjectA = UUID.randomUUID();
        UUID subjectB = UUID.randomUUID();
        when(jdbc.queryForList(any(String.class), eq(UUID.class), eq(target))).thenReturn(List.of(subjectA));
        when(jdbc.queryForList(any(String.class), eq(UUID.class), eq(source))).thenReturn(List.of(subjectB));
        assertThrows(BadRequestException.class, () -> service.merge(new MergeRequest(target, List.of(source), null)));
    }

    @Test
    void movesQuestionsAndDeletesSources() {
        UUID target = UUID.randomUUID();
        UUID source = UUID.randomUUID();
        UUID subject = UUID.randomUUID();
        when(jdbc.queryForList(any(String.class), eq(UUID.class), any(Object.class))).thenReturn(List.of(subject));
        when(jdbc.update(eq("UPDATE questions SET topic_id = ? WHERE topic_id = ?"), eq(target), eq(source))).thenReturn(7);
        when(jdbc.queryForObject(any(String.class), eq(String.class), eq(target))).thenReturn("Arrays");

        var result = service.merge(new MergeRequest(target, List.of(source), null));

        org.junit.jupiter.api.Assertions.assertEquals(7, result.questionsMoved());
        org.junit.jupiter.api.Assertions.assertEquals(1, result.topicsRemoved());
        verify(jdbc).update("DELETE FROM topics WHERE id = ?", source);
    }
}
