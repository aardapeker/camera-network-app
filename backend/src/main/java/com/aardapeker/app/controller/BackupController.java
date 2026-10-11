package com.aardapeker.app.controller;

import com.aardapeker.app.dto.response.BackupLogResponse;
import com.aardapeker.app.model.BackupLog;
import com.aardapeker.app.service.BackupService;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// Endpoints are under /api/admin/** which is already restricted to ROLE_ADMIN in SecurityConfig
@RestController
@RequestMapping("/api/admin/backup")
public class BackupController {

    private final BackupService backupService;

    public BackupController(BackupService backupService) {
        this.backupService = backupService;
    }

    @PostMapping("/create")
    public ResponseEntity<BackupLogResponse> createBackup() {
        BackupLog log = backupService.createBackup();
        return ResponseEntity.ok(BackupLogResponse.from(log));
    }

    // backupKey is passed as plain text in request body (S3 key, e.g. "db/backup-2026-02-22T00-00.sql.gz")
    @PostMapping("/restore")
    public ResponseEntity<BackupLogResponse> restoreBackup(@RequestBody String backupKey) {
        BackupLog log = backupService.restoreBackup(backupKey.trim());
        return ResponseEntity.ok(BackupLogResponse.from(log));
    }

    @GetMapping("/logs")
    public ResponseEntity<List<BackupLogResponse>> getLogs() {
        return ResponseEntity.ok(backupService.getLogs());
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Boolean>> health() {
        return ResponseEntity.ok(Map.of("healthy", backupService.isS3Healthy()));
    }
}
