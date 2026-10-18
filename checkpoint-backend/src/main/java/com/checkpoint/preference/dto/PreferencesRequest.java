package com.checkpoint.preference.dto;

import java.util.List;
import java.util.UUID;

public record PreferencesRequest(UUID streamId, UUID examId, List<UUID> subjectIds) {
}
