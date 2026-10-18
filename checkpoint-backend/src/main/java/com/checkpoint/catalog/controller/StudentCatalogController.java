package com.checkpoint.catalog.controller;

import com.checkpoint.catalog.dto.CatalogResponse;
import com.checkpoint.catalog.service.CatalogService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/catalog")
public class StudentCatalogController {

    private final CatalogService catalogService;

    public StudentCatalogController(CatalogService catalogService) {
        this.catalogService = catalogService;
    }

    @GetMapping
    public ResponseEntity<CatalogResponse> get() {
        return ResponseEntity.ok(catalogService.studentSnapshot());
    }
}
