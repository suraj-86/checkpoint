package com.checkpoint.catalog.repository;

import com.checkpoint.catalog.entity.Exam;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ExamRepository extends JpaRepository<Exam, UUID> {

    List<Exam> findAllByOrderBySortOrderAscNameAsc();

    Optional<Exam> findByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, UUID id);
}
