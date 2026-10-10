package com.checkpoint.interest.dto;

import java.util.List;
import java.util.UUID;

public record InterestsResponse(List<UUID> topicIds) {
}
