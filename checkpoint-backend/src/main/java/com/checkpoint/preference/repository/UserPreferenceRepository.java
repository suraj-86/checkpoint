package com.checkpoint.preference.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Repository
public class UserPreferenceRepository {

    public record StreamExam(UUID streamId, UUID examId) {
    }

    private final JdbcTemplate jdbcTemplate;

    public UserPreferenceRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public StreamExam findStreamExam(UUID userId) {
        List<StreamExam> rows = jdbcTemplate.query(
                "SELECT stream_id, exam_id FROM user_preferences WHERE user_id = ?",
                (rs, i) -> new StreamExam(rs.getObject("stream_id", UUID.class), rs.getObject("exam_id", UUID.class)),
                userId);
        return rows.isEmpty() ? new StreamExam(null, null) : rows.get(0);
    }

    public Set<UUID> findSubjectIds(UUID userId) {
        return new LinkedHashSet<>(jdbcTemplate.queryForList(
                "SELECT subject_id FROM user_subject_preferences WHERE user_id = ?", UUID.class, userId));
    }

    public void replace(UUID userId, UUID streamId, UUID examId, Collection<UUID> subjectIds) {
        jdbcTemplate.update("""
                INSERT INTO user_preferences (user_id, stream_id, exam_id) VALUES (?, ?, ?)
                ON CONFLICT (user_id) DO UPDATE SET stream_id = EXCLUDED.stream_id, exam_id = EXCLUDED.exam_id
                """, userId, streamId, examId);
        jdbcTemplate.update("DELETE FROM user_subject_preferences WHERE user_id = ?", userId);
        if (subjectIds.isEmpty()) {
            return;
        }
        List<Object[]> rows = subjectIds.stream().map(id -> new Object[]{userId, id}).toList();
        jdbcTemplate.batchUpdate("INSERT INTO user_subject_preferences (user_id, subject_id) VALUES (?, ?)", rows);
    }
}
