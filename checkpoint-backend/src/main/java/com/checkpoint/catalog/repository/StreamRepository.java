package com.checkpoint.catalog.repository;

import com.checkpoint.catalog.entity.Stream;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StreamRepository extends JpaRepository<Stream, UUID> {

    List<Stream> findAllByOrderBySortOrderAscNameAsc();

    Optional<Stream> findByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, UUID id);
}
