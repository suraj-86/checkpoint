package com.checkpoint.admin.service;

import com.checkpoint.admin.dto.AdminDashboardResponse;
import com.checkpoint.admin.dto.DatasetSummary;
import com.checkpoint.admin.dto.NameCount;
import com.checkpoint.admin.dto.TopicCount;
import com.checkpoint.catalog.entity.Stream;
import com.checkpoint.catalog.entity.Subject;
import com.checkpoint.catalog.repository.ExamRepository;
import com.checkpoint.catalog.repository.StreamRepository;
import com.checkpoint.catalog.repository.SubjectRepository;
import com.checkpoint.question.entity.Difficulty;
import com.checkpoint.question.entity.QuestionType;
import com.checkpoint.question.repository.QuestionDatasetRepository;
import com.checkpoint.question.repository.QuestionRepository;
import com.checkpoint.topic.repository.TopicRepository;
import com.checkpoint.user.entity.Role;
import com.checkpoint.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class AdminDashboardService {

    private final QuestionRepository questionRepository;
    private final QuestionDatasetRepository datasetRepository;
    private final TopicRepository topicRepository;
    private final UserRepository userRepository;
    private final DatasetImportService datasetImportService;
    private final SubjectRepository subjectRepository;
    private final StreamRepository streamRepository;
    private final ExamRepository examRepository;

    public AdminDashboardService(
            QuestionRepository questionRepository,
            QuestionDatasetRepository datasetRepository,
            TopicRepository topicRepository,
            UserRepository userRepository,
            DatasetImportService datasetImportService,
            SubjectRepository subjectRepository,
            StreamRepository streamRepository,
            ExamRepository examRepository
    ) {
        this.questionRepository = questionRepository;
        this.datasetRepository = datasetRepository;
        this.topicRepository = topicRepository;
        this.userRepository = userRepository;
        this.datasetImportService = datasetImportService;
        this.subjectRepository = subjectRepository;
        this.streamRepository = streamRepository;
        this.examRepository = examRepository;
    }

    @Transactional(readOnly = true)
    public AdminDashboardResponse getDashboard() {
        long active = questionRepository.countByActive(true);
        long retired = questionRepository.countByActive(false);

        Map<String, Long> byDifficulty = new LinkedHashMap<>();
        for (Difficulty d : Difficulty.values()) {
            byDifficulty.put(d.name(), 0L);
        }
        for (Object[] row : questionRepository.countActiveByDifficulty()) {
            byDifficulty.put(((Difficulty) row[0]).name(), (Long) row[1]);
        }

        Map<String, Long> byType = new LinkedHashMap<>();
        for (QuestionType t : QuestionType.values()) {
            byType.put(t.name(), 0L);
        }
        for (Object[] row : questionRepository.countActiveByType()) {
            byType.put(((QuestionType) row[0]).name(), (Long) row[1]);
        }

        List<TopicCount> byTopic = questionRepository.countActiveByTopic().stream()
                .map(row -> new TopicCount((String) row[0], (Long) row[1]))
                .toList();

        List<NameCount> bySubject = new java.util.ArrayList<>();
        Map<UUID, Long> subjectCounts = new HashMap<>();
        for (Object[] row : questionRepository.countActiveBySubject()) {
            bySubject.add(new NameCount((String) row[1], (Long) row[2]));
            subjectCounts.put((UUID) row[0], (Long) row[2]);
        }
        Map<String, Long> streamTotals = new HashMap<>();
        for (Subject subject : subjectRepository.findAll()) {
            long n = subjectCounts.getOrDefault(subject.getId(), 0L);
            for (Stream stream : subject.getStreams()) streamTotals.merge(stream.getName(), n, Long::sum);
        }
        List<NameCount> byStream = streamTotals.entrySet().stream()
                .map(e -> new NameCount(e.getKey(), e.getValue()))
                .sorted(Comparator.comparingLong(NameCount::count).reversed().thenComparing(NameCount::name))
                .toList();

        List<DatasetSummary> datasets = datasetImportService.listDatasets();
        DatasetSummary latest = datasets.isEmpty() ? null : datasets.get(0);

        return new AdminDashboardResponse(
                active + retired,
                active,
                retired,
                topicRepository.count(),
                subjectRepository.count(),
                streamRepository.count(),
                examRepository.count(),
                datasetRepository.count(),
                userRepository.countByRole(Role.STUDENT),
                byDifficulty,
                byType,
                byTopic,
                bySubject,
                byStream,
                latest
        );
    }
}
