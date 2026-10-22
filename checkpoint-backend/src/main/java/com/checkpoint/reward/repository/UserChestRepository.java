package com.checkpoint.reward.repository;

import com.checkpoint.reward.entity.ChestSource;
import com.checkpoint.reward.entity.UserChest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserChestRepository extends JpaRepository<UserChest, UUID> {

    List<UserChest> findByUserIdAndOpenedAtIsNullOrderByEarnedAtAsc(UUID userId);

    Optional<UserChest> findByIdAndUserId(UUID id, UUID userId);

    boolean existsByUserIdAndSourceKey(UUID userId, String sourceKey);

    long countByUserIdAndSourceAndEarnedAtGreaterThanEqualAndEarnedAtLessThan(
            UUID userId, ChestSource source, Instant from, Instant to);

    long countByOpenedAtIsNotNull();
}
