package com.checkpoint.admin.service;

import com.checkpoint.admin.dto.AdminDashboardResponse;
import com.checkpoint.admin.dto.DatasetSummary;
import com.checkpoint.admin.dto.TopicCount;
import com.checkpoint.question.entity.Difficulty;
import com.checkpoint.question.entity.QuestionType;
import com.checkpoint.question.repository.QuestionDatasetRepository;
import com.checkpoint.question.repository.QuestionRepository;
import com.checkpoint.topic.repository.TopicRepository;
import com.checkpoint.user.entity.Role;
import com.checkpoint.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class AdminDashboardService {

    private final QuestionRepository questionRepository;
    private final QuestionDatasetRepository datasetRepository;
    private final TopicRepository topicRepository;
    private final UserRepository userRepository;
    private final DatasetImportService datasetImportService;

    public AdminDashboardService(
            QuestionRepository questionRepository,
            QuestionDatasetRepository datasetRepository,
            TopicRepository topicRepository,
            UserRepository userRepository,
            DatasetImportService datasetImportService
    ) {
        this.questionRepository = questionRepository;
        this.datasetRepository = datasetRepository;
        this.topicRepository = topicRepository;
        this.userRepository = userRepository;
        this.datasetImportService = datasetImportService;
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

        List<DatasetSummary> datasets = datasetImportService.listDatasets();
        DatasetSummary latest = datasets.isEmpty() ? null : datasets.get(0);

        return new AdminDashboardResponse(
                active + retired,
                active,
                retired,
                topicRepository.count(),
                datasetRepository.count(),
                userRepository.countByRole(Role.STUDENT),
                byDifficulty,
                byType,
                byTopic,
                latest
        );
    }
}
