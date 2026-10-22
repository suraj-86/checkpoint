package com.checkpoint.reward.repository;

import com.checkpoint.reward.entity.RewardItem;
import com.checkpoint.reward.entity.RewardKind;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RewardItemRepository extends JpaRepository<RewardItem, UUID> {

    List<RewardItem> findByKindAndEnabledTrue(RewardKind kind);

    List<RewardItem> findAllByOrderByKindAscNameAsc();

    Optional<RewardItem> findByCode(String code);
}
