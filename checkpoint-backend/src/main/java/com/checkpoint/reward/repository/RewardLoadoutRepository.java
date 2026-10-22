package com.checkpoint.reward.repository;

import com.checkpoint.reward.entity.RewardLoadout;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface RewardLoadoutRepository extends JpaRepository<RewardLoadout, UUID> {
}
