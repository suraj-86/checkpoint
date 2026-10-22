package com.checkpoint.reward.repository;

import com.checkpoint.reward.entity.StreakMilestone;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StreakMilestoneRepository extends JpaRepository<StreakMilestone, Integer> {

    Optional<StreakMilestone> findByDaysAndEnabledTrue(int days);

    List<StreakMilestone> findAllByOrderByDaysAsc();
}
