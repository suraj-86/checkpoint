package com.checkpoint.admin.service;

import com.checkpoint.admin.dto.TopicMergeDtos.MergeRequest;
import com.checkpoint.admin.dto.TopicMergeDtos.MergeResult;
import com.checkpoint.common.exception.BadRequestException;
import com.checkpoint.common.exception.ConflictException;
import com.checkpoint.common.exception.NotFoundException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;


@Service
public class TopicMergeService {

    static final int MAX_SOURCES = 100;
    static final int MAX_NAME = 80;

    private final JdbcTemplate jdbc;

    public TopicMergeService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Transactional
    public MergeResult merge(MergeRequest request) {
        if (request == null || request.targetId() == null) {
            throw new BadRequestException("Choose the topic to keep.");
        }
        if (request.sourceIds() == null || request.sourceIds().isEmpty()) {
            throw new BadRequestException("Choose at least one topic to merge into it.");
        }
        Set<UUID> sources = new LinkedHashSet<>(request.sourceIds());
        if (sources.size() > MAX_SOURCES) {
            throw new BadRequestException("Too many topics in one go (maximum " + MAX_SOURCES + ").");
        }
        UUID targetId = request.targetId();
        if (sources.contains(targetId)) {
            throw new BadRequestException("The topic to keep cannot also be merged into itself.");
        }

        UUID subjectId = subjectOf(targetId);
        for (UUID source : sources) {
            if (!subjectId.equals(subjectOf(source))) {
                throw new BadRequestException("All topics must belong to the same subject.");
            }
        }

        int moved = 0;
        for (UUID source : sources) {
            moved += jdbc.update("UPDATE questions SET topic_id = ? WHERE topic_id = ?", targetId, source);
            jdbc.update("""
                    INSERT INTO user_topic_interests (user_id, topic_id)
                    SELECT user_id, ? FROM user_topic_interests WHERE topic_id = ?
                    ON CONFLICT DO NOTHING""", targetId, source);
        }
        for (UUID source : sources) {
            jdbc.update("DELETE FROM topics WHERE id = ?", source);
        }

        String newName = request.newName() == null ? "" : request.newName().trim();
        if (!newName.isEmpty()) {
            if (newName.length() > MAX_NAME) {
                throw new BadRequestException("A topic name can have at most " + MAX_NAME + " characters.");
            }
            Integer clash = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM topics WHERE subject_id = ? AND lower(name) = lower(?) AND id <> ?",
                    Integer.class, subjectId, newName, targetId);
            if (clash != null && clash > 0) {
                throw new ConflictException("TOPIC_NAME_TAKEN", "Another topic in this subject is already called \"" + newName + "\".");
            }
            jdbc.update("UPDATE topics SET name = ? WHERE id = ?", newName, targetId);
        }

        String name = jdbc.queryForObject("SELECT name FROM topics WHERE id = ?", String.class, targetId);
        return new MergeResult(moved, sources.size(), name);
    }

    private UUID subjectOf(UUID topicId) {
        List<UUID> rows = jdbc.queryForList("SELECT subject_id FROM topics WHERE id = ?", UUID.class, topicId);
        if (rows.isEmpty() || rows.get(0) == null) {
            throw new NotFoundException("Topic not found");
        }
        return rows.get(0);
    }
}
