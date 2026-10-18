package com.checkpoint.preference.service;

import com.checkpoint.catalog.repository.ExamRepository;
import com.checkpoint.catalog.repository.StreamRepository;
import com.checkpoint.catalog.repository.SubjectRepository;
import com.checkpoint.common.exception.BadRequestException;
import com.checkpoint.preference.dto.PreferencesResponse;
import com.checkpoint.preference.repository.UserPreferenceRepository;
import com.checkpoint.user.entity.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class PreferenceService {

    private static final int MAX_SUBJECTS = 50;

    private final UserPreferenceRepository repository;
    private final StreamRepository streamRepository;
    private final ExamRepository examRepository;
    private final SubjectRepository subjectRepository;

    public PreferenceService(
            UserPreferenceRepository repository,
            StreamRepository streamRepository,
            ExamRepository examRepository,
            SubjectRepository subjectRepository
    ) {
        this.repository = repository;
        this.streamRepository = streamRepository;
        this.examRepository = examRepository;
        this.subjectRepository = subjectRepository;
    }

    @Transactional(readOnly = true)
    public PreferencesResponse get(User user) {
        var streamExam = repository.findStreamExam(user.getId());
        return new PreferencesResponse(
                streamExam.streamId(), streamExam.examId(), List.copyOf(repository.findSubjectIds(user.getId())));
    }

    @Transactional
    public PreferencesResponse replace(User user, UUID streamId, UUID examId, List<UUID> requestedSubjects) {
        Set<UUID> subjectIds = new LinkedHashSet<>(requestedSubjects == null ? List.of() : requestedSubjects);

        if (subjectIds.contains(null)) {
            throw new BadRequestException("subjectIds must not contain null values.");
        }
        if (subjectIds.size() > MAX_SUBJECTS) {
            throw new BadRequestException("Too many subjects selected.");
        }
        if (streamId != null && !streamRepository.existsById(streamId)) {
            throw new BadRequestException("The selected stream does not exist.");
        }
        if (examId != null && !examRepository.existsById(examId)) {
            throw new BadRequestException("The selected exam does not exist.");
        }
        if (!subjectIds.isEmpty() && subjectRepository.findAllById(subjectIds).size() != subjectIds.size()) {
            throw new BadRequestException("One or more selected subjects do not exist.");
        }

        repository.replace(user.getId(), streamId, examId, subjectIds);
        return new PreferencesResponse(streamId, examId, List.copyOf(subjectIds));
    }
}
