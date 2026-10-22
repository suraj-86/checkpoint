package com.checkpoint.reward.repository;

import com.checkpoint.reward.entity.UserBoost;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface UserBoostRepository extends JpaRepository<UserBoost, UUID> {

    List<UserBoost> findByUserIdAndUsedAtIsNullOrderByCreatedAtAsc(UUID userId);

    long countByUsedAtIsNotNull();
}
