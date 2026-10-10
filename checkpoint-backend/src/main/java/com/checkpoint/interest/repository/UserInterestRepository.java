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

    public void replaceAll(UUID userId, Collection<UUID> topicIds) {
        jdbcTemplate.update("DELETE FROM user_topic_interests WHERE user_id = ?", userId);
        if (topicIds.isEmpty()) {
            return;
        }
        List<Object[]> rows = topicIds.stream().map(topicId -> new Object[]{userId, topicId}).toList();
        jdbcTemplate.batchUpdate("INSERT INTO user_topic_interests (user_id, topic_id) VALUES (?, ?)", rows);
    }
}
