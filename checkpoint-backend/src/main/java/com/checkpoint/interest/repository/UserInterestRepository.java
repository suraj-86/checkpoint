package com.checkpoint.interest.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Repository
public class UserInterestRepository {

    private final JdbcTemplate jdbcTemplate;

    public UserInterestRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Set<UUID> findTopicIds(UUID userId) {
        List<UUID> ids = jdbcTemplate.queryForList(
                "SELECT topic_id FROM user_topic_interests WHERE user_id = ?", UUID.class, userId);
        return new LinkedHashSet<>(ids);
    }


    public Set<UUID> findEffectiveTopicIds(UUID userId) {
        Set<UUID> topics = findTopicIds(userId);
        if (!topics.isEmpty()) {
            return topics;
        }

        String activeTopics = """
                SELECT t.id FROM topics t JOIN subjects s ON s.id = t.subject_id
                WHERE t.active = true AND s.active = true AND s.id IN (%s)
                """;

        Set<UUID> fromSubjects = new LinkedHashSet<>(jdbcTemplate.queryForList(
                activeTopics.formatted("SELECT subject_id FROM user_subject_preferences WHERE user_id = ?"), UUID.class, userId));
        if (!fromSubjects.isEmpty()) {
            return fromSubjects;
        }

        Set<UUID> fromExam = new LinkedHashSet<>(jdbcTemplate.queryForList(
                activeTopics.formatted("""
                        SELECT se.subject_id FROM subject_exams se
                        JOIN user_preferences p ON p.exam_id = se.exam_id WHERE p.user_id = ?"""), UUID.class, userId));
        if (!fromExam.isEmpty()) {
            return fromExam;
        }

        return new LinkedHashSet<>(jdbcTemplate.queryForList(
                activeTopics.formatted("""
                        SELECT ss.subject_id FROM stream_subjects ss
                        JOIN user_preferences p ON p.stream_id = ss.stream_id WHERE p.user_id = ?"""), UUID.class, userId));
    }

    public void replaceAll(UUID userId, Collection<UUID> topicIds) {
        jdbcTemplate.update("DELETE FROM user_topic_interests WHERE user_id = ?", userId);
        if (topicIds.isEmpty()) {
            return;
        }
        List<Object[]> rows = topicIds.stream().map(topicId -> new Object[]{userId, topicId}).toList();
        jdbcTemplate.batchUpdate("INSERT INTO user_topic_interests (user_id, topic_id) VALUES (?, ?)", rows);
    }
}
