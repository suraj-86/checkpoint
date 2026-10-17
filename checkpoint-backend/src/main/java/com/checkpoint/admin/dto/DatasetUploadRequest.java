package com.checkpoint.admin.dto;

import java.util.List;
import java.util.UUID;

public record DatasetUploadRequest(DatasetMeta dataset, List<QuestionUpload> questions, UUID topicId, UUID subjectId) {

    public DatasetUploadRequest(DatasetMeta dataset, List<QuestionUpload> questions) {
        this(dataset, questions, null, null);
    }
}
