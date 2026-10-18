package com.checkpoint.progress.dto;

import java.util.List;

public record MasteryResponse(
        List<SubjectMastery> subjects,
        List<TopicMastery> weakest
) {
}
