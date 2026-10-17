package com.checkpoint.catalog.dto;

import java.util.List;
import java.util.UUID;

public record IdListRequest(List<UUID> ids) {
}
