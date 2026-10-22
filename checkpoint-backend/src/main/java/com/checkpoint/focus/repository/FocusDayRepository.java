package com.checkpoint.focus.repository;

import com.checkpoint.focus.entity.FocusDay;
import com.checkpoint.focus.entity.FocusDayId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FocusDayRepository extends JpaRepository<FocusDay, FocusDayId> {

    Optional<FocusDay> findByUserIdAndDay(UUID userId, LocalDate day);

    List<FocusDay> findByUserIdAndDayGreaterThanEqualOrderByDayDesc(UUID userId, LocalDate from);
}
