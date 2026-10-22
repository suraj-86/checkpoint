package com.checkpoint.reward.repository;

import com.checkpoint.reward.entity.ChestTier;
import com.checkpoint.reward.entity.RewardOdds;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RewardOddsRepository extends JpaRepository<RewardOdds, ChestTier> {
}
