package com.checkpoint.support.service;

import com.checkpoint.common.dto.PageResponse;
import com.checkpoint.common.exception.BadRequestException;
import com.checkpoint.common.exception.NotFoundException;
import com.checkpoint.common.exception.RateLimitExceededException;
import com.checkpoint.support.dto.AdminSupportItem;
import com.checkpoint.support.dto.SupportRequestCreate;
import com.checkpoint.support.dto.SupportRequestItem;
import com.checkpoint.support.entity.SupportKind;
import com.checkpoint.support.entity.SupportRequest;
import com.checkpoint.support.entity.SupportStatus;
import com.checkpoint.support.repository.SupportRequestRepository;
import com.checkpoint.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class SupportService {

    static final int MIN_MESSAGE = 5;
    static final int MAX_MESSAGE = 1000;
    static final int MAX_SUBJECT = 100;
    static final int MAX_PER_DAY = 10;

    private final SupportRequestRepository repository;
    private final Clock clock;

    public SupportService(SupportRequestRepository repository, Clock clock) {
        this.repository = repository;
        this.clock = clock;
    }

    @Transactional
    public SupportRequestItem create(User user, SupportRequestCreate request) {
        SupportKind kind = parseKind(request.kind());
        String message = request.message() == null ? "" : request.message().trim();
        if (message.length() < MIN_MESSAGE) {
            throw new BadRequestException("Please write at least " + MIN_MESSAGE + " characters.");
        }
        if (message.length() > MAX_MESSAGE) {
            throw new BadRequestException("Please keep your message under " + MAX_MESSAGE + " characters.");
        }
        String subject = request.subject() == null ? null : request.subject().trim();
        if (subject != null && subject.isEmpty()) {
            subject = null;
        }
        if (subject != null && subject.length() > MAX_SUBJECT) {
            throw new BadRequestException("The title must be under " + MAX_SUBJECT + " characters.");
        }

        Instant now = Instant.now(clock);
        if (repository.countByUserIdAndCreatedAtAfter(user.getId(), now.minus(Duration.ofDays(1))) >= MAX_PER_DAY) {
            throw new RateLimitExceededException("You have sent a lot of requests today. Please try again tomorrow.");
        }

        SupportRequest saved = repository.save(SupportRequest.builder()
                .user(user)
                .kind(kind)
                .subject(subject)
                .message(message)
                .status(SupportStatus.OPEN)
                .createdAt(now)
                .build());
        return SupportRequestItem.from(saved);
    }

    @Transactional(readOnly = true)
    public List<SupportRequestItem> listMine(User user) {
        return repository.findTop20ByUserIdOrderByCreatedAtDesc(user.getId()).stream().map(SupportRequestItem::from).toList();
    }

    @Transactional(readOnly = true)
    public PageResponse<AdminSupportItem> adminList(String status, Pageable pageable) {
        Page<SupportRequest> page = (status == null || status.isBlank())
                ? repository.findAllByOrderByCreatedAtDesc(pageable)
                : repository.findByStatusOrderByCreatedAtDesc(parseStatus(status), pageable);
        return PageResponse.from(page.map(AdminSupportItem::from));
    }

    @Transactional(readOnly = true)
    public long openCount() {
        return repository.countByStatus(SupportStatus.OPEN);
    }

    @Transactional
    public AdminSupportItem setStatus(UUID id, String status) {
        SupportRequest request = repository.findById(id).orElseThrow(() -> new NotFoundException("Request not found."));
        SupportStatus next = parseStatus(status);
        request.setStatus(next);
        request.setResolvedAt(next == SupportStatus.DONE ? Instant.now(clock) : null);
        return AdminSupportItem.from(repository.save(request));
    }

    static SupportKind parseKind(String value) {
        try {
            return SupportKind.valueOf(value == null ? "" : value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Choose what kind of request this is.");
        }
    }

    static SupportStatus parseStatus(String value) {
        try {
            return SupportStatus.valueOf(value == null ? "" : value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Status must be OPEN or DONE.");
        }
    }
}
