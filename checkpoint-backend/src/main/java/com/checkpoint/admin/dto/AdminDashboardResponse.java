package com.checkpoint.admin.dto;

import java.util.List;
import java.util.Map;

public record AdminDashboardResponse(
        long totalQuestions,
        long activeQuestions,
        long retiredQuestions,
        long topicCount,
        long datasetCount,
        long studentCount,
        Map<String, Long> activeByDifficulty,
        Map<String, Long> activeByType,
        List<TopicCount> activeByTopic,
        DatasetSummary latestDataset
) {
}
