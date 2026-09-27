package com.checkpoint.admin.dto;

import java.util.List;

public record DatasetUploadRequest(DatasetMeta dataset, List<QuestionUpload> questions) {
}
