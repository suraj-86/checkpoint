package com.checkpoint.admin.controller;

import com.checkpoint.admin.dto.DatasetActionResponse;
import com.checkpoint.admin.dto.DatasetImpactResponse;
import com.checkpoint.admin.dto.DatasetSummary;
import com.checkpoint.admin.dto.DatasetUploadRequest;
import com.checkpoint.admin.dto.ImportResponse;
import com.checkpoint.admin.dto.MoveDatasetRequest;
import com.checkpoint.admin.dto.ValidationResponse;
import com.checkpoint.admin.service.DatasetAdminService;
import com.checkpoint.admin.service.DatasetImportService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/datasets")
public class AdminDatasetController {

    private final DatasetImportService datasetImportService;
    private final DatasetAdminService datasetAdminService;

    public AdminDatasetController(DatasetImportService datasetImportService, DatasetAdminService datasetAdminService) {
        this.datasetImportService = datasetImportService;
        this.datasetAdminService = datasetAdminService;
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

    @GetMapping("/{id}/impact")
    public ResponseEntity<DatasetImpactResponse> impact(@PathVariable UUID id) {
        return ResponseEntity.ok(datasetAdminService.impact(id));
    }

    @PatchMapping("/{id}/topic")
    public ResponseEntity<DatasetActionResponse> moveToTopic(
            @PathVariable UUID id, @Valid @RequestBody MoveDatasetRequest request) {
        return ResponseEntity.ok(datasetAdminService.moveToTopic(id, request.topicId()));
    }

    @PatchMapping("/{id}/retire")
    public ResponseEntity<DatasetActionResponse> retire(@PathVariable UUID id) {
        return ResponseEntity.ok(datasetAdminService.retire(id));
    }

    @PatchMapping("/{id}/restore")
    public ResponseEntity<DatasetActionResponse> restore(@PathVariable UUID id) {
        return ResponseEntity.ok(datasetAdminService.restore(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<DatasetActionResponse> delete(
            @PathVariable UUID id, @RequestParam("confirmName") String confirmName) {
        return ResponseEntity.ok(datasetAdminService.delete(id, confirmName));
    }
}
