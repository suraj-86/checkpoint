package com.checkpoint.focus.repository;

import com.checkpoint.focus.entity.FocusState;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface FocusStateRepository extends JpaRepository<FocusState, UUID> {
}
