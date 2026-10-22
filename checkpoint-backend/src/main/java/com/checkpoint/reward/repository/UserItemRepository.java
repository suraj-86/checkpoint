package com.checkpoint.reward.repository;

import com.checkpoint.reward.entity.UserItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface UserItemRepository extends JpaRepository<UserItem, UUID> {

    List<UserItem> findByUserId(UUID userId);

    long countByItemId(UUID itemId);
}
