package com.aardapeker.app.controller;

import com.aardapeker.app.storage.BlueprintFileInfo;
import com.aardapeker.app.storage.StorageAdminService;
import com.aardapeker.app.storage.StorageStats;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/storage")
public class StorageAdminController {

    private final StorageAdminService storageAdminService;

    public StorageAdminController(StorageAdminService storageAdminService) {
        this.storageAdminService = storageAdminService;
    }

    @GetMapping("/stats")
    public ResponseEntity<StorageStats> getStats() {
        return ResponseEntity.ok(storageAdminService.getStats());
    }

    @GetMapping("/blueprints")
    public ResponseEntity<List<BlueprintFileInfo>> listBlueprints() {
        return ResponseEntity.ok(storageAdminService.listBlueprints());
    }

    @DeleteMapping("/blueprints")
    public ResponseEntity<Map<String, Integer>> deleteBlueprints(
            @RequestBody List<String> relativePaths) {
        storageAdminService.deleteBlueprints(relativePaths);
        return ResponseEntity.ok(Map.of("deleted", relativePaths.size()));
    }

    @DeleteMapping("/orphaned")
    public ResponseEntity<Map<String, String>> deleteOrphaned() {
        storageAdminService.deleteOrphaned();
        return ResponseEntity.ok(Map.of("status", "ok"));
    }
}
