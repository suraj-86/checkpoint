package com.checkpoint.admin.controller;

import com.checkpoint.admin.dto.DatasetSummary;
import com.checkpoint.admin.dto.DatasetUploadRequest;
import com.checkpoint.admin.dto.ImportResponse;
import com.checkpoint.admin.dto.ValidationResponse;
import com.checkpoint.admin.service.DatasetImportService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/datasets")
public class AdminDatasetController {

    private final DatasetImportService datasetImportService;

    public AdminDatasetController(DatasetImportService datasetImportService) {
        this.datasetImportService = datasetImportService;
    }

    @PostMapping("/validate")
    public ResponseEntity<ValidationResponse> validate(@RequestBody DatasetUploadRequest request) {
        return ResponseEntity.ok(datasetImportService.validate(request));
    }

    @PostMapping("/import")
    public ResponseEntity<ImportResponse> importDataset(@RequestBody DatasetUploadRequest request) {
        return ResponseEntity.ok(datasetImportService.importDataset(request));
    }

    @GetMapping
    public ResponseEntity<List<DatasetSummary>> listDatasets() {
        return ResponseEntity.ok(datasetImportService.listDatasets());
    }
}
