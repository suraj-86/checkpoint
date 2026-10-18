package com.checkpoint.support.service;

import com.checkpoint.common.exception.BadRequestException;
import com.checkpoint.common.exception.NotFoundException;
import com.checkpoint.common.exception.RateLimitExceededException;
import com.checkpoint.support.dto.SupportRequestCreate;
import com.checkpoint.support.dto.SupportRequestItem;
import com.checkpoint.support.entity.SupportKind;
import com.checkpoint.support.entity.SupportRequest;
import com.checkpoint.support.entity.SupportStatus;
import com.checkpoint.support.repository.SupportRequestRepository;
import com.checkpoint.user.entity.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SupportServiceTest {

    private static final Instant NOW = Instant.parse("2026-10-18T10:00:00Z");

    @Mock
    private SupportRequestRepository repository;

    private final User user = User.builder().id(UUID.randomUUID()).username("student").build();

    private SupportService service() {
        return new SupportService(repository, Clock.fixed(NOW, ZoneOffset.UTC));
    }

    @Test
    void createTrimsAndStoresAnOpenRequest() {
        when(repository.countByUserIdAndCreatedAtAfter(any(), any())).thenReturn(0L);
        when(repository.save(any(SupportRequest.class))).thenAnswer(inv -> inv.getArgument(0));

        SupportRequestItem item = service().create(user, new SupportRequestCreate("topic_request", "  Rust  ", "  Please add Rust basics  "));

        ArgumentCaptor<SupportRequest> saved = ArgumentCaptor.forClass(SupportRequest.class);
        verify(repository).save(saved.capture());
        assertThat(saved.getValue().getKind()).isEqualTo(SupportKind.TOPIC_REQUEST);
        assertThat(saved.getValue().getSubject()).isEqualTo("Rust");
        assertThat(saved.getValue().getMessage()).isEqualTo("Please add Rust basics");
        assertThat(saved.getValue().getStatus()).isEqualTo(SupportStatus.OPEN);
        assertThat(saved.getValue().getCreatedAt()).isEqualTo(NOW);
        assertThat(item.status()).isEqualTo(SupportStatus.OPEN);
    }

    @Test
    void blankTitleIsStoredAsNull() {
        when(repository.countByUserIdAndCreatedAtAfter(any(), any())).thenReturn(0L);
        when(repository.save(any(SupportRequest.class))).thenAnswer(inv -> inv.getArgument(0));

        SupportRequestItem item = service().create(user, new SupportRequestCreate("FEEDBACK", "   ", "Love the new map"));

        assertThat(item.subject()).isNull();
    }

    @Test
    void rejectsUnknownKind() {
        assertThatThrownBy(() -> service().create(user, new SupportRequestCreate("SPAM", null, "Hello there")))
                .isInstanceOf(BadRequestException.class);
        verify(repository, never()).save(any());
    }

    @Test
    void rejectsShortAndLongMessages() {
        assertThatThrownBy(() -> service().create(user, new SupportRequestCreate("BUG", null, "  hi ")))
                .isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> service().create(user, new SupportRequestCreate("BUG", null, "x".repeat(1001))))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void rejectsAnOverlongTitle() {
        assertThatThrownBy(() -> service().create(user, new SupportRequestCreate("BUG", "t".repeat(101), "Something broke")))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void stopsAfterTenRequestsInADay() {
        when(repository.countByUserIdAndCreatedAtAfter(any(), any())).thenReturn(10L);

        assertThatThrownBy(() -> service().create(user, new SupportRequestCreate("BUG", null, "Something broke")))
                .isInstanceOf(RateLimitExceededException.class);
        verify(repository, never()).save(any());
    }

    @Test
    void markingDoneStampsResolvedAndReopeningClearsIt() {
        UUID id = UUID.randomUUID();
        SupportRequest request = SupportRequest.builder().id(id).user(user).kind(SupportKind.BUG).message("Broken")
                .status(SupportStatus.OPEN).createdAt(NOW.minusSeconds(60)).build();
        when(repository.findById(id)).thenReturn(Optional.of(request));
        when(repository.save(any(SupportRequest.class))).thenAnswer(inv -> inv.getArgument(0));

        assertThat(service().setStatus(id, "done").resolvedAt()).isEqualTo(NOW);
        assertThat(service().setStatus(id, "OPEN").resolvedAt()).isNull();
    }

    @Test
    void settingStatusOnAMissingRequestIsNotFound() {
        UUID id = UUID.randomUUID();
        when(repository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service().setStatus(id, "DONE")).isInstanceOf(NotFoundException.class);
    }

    @Test
    void rejectsAnUnknownStatus() {
        UUID id = UUID.randomUUID();
        when(repository.findById(id)).thenReturn(Optional.of(SupportRequest.builder().id(id).user(user).build()));

        assertThatThrownBy(() -> service().setStatus(id, "ARCHIVED")).isInstanceOf(BadRequestException.class);
    }
}
