package com.checkpoint.practice.dto;

import java.util.UUID;

public record SlotInfo(int position, UUID questionId, boolean primary, String status) {
}
