package com.aardapeker.app.networkscan;

import com.aardapeker.app.dto.response.PageResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/network-scans")
public class NetworkScanController {

    private final NetworkScanService service;

    public NetworkScanController(NetworkScanService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<List<ScanHostResponse>> submit(@Valid @RequestBody ScanBatchRequest request) {
        List<ScanHostResponse> saved = service.recordBatch(request).stream()
                .map(ScanHostResponse::from)
                .toList();
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping
    public ResponseEntity<PageResponse<ScanHostResponse>> list(GetNetworkScansRequest request) {
        return ResponseEntity.ok(service.getPage(request));
    }

    @GetMapping("/sources")
    public ResponseEntity<List<String>> sources() {
        return ResponseEntity.ok(service.getDistinctSources());
    }

    @GetMapping("/agent-settings")
    public ResponseEntity<List<ScanAgentSettingsResponse>> agentSettings() {
        return ResponseEntity.ok(service.listAgentSettings());
    }

    @PutMapping("/agent-settings/{sourceId}")
    public ResponseEntity<ScanAgentSettingsResponse> saveAgentSettings(
            @PathVariable String sourceId,
            @Valid @RequestBody ScanAgentSettingsRequest request) {
        return ResponseEntity.ok(service.saveAgentSettings(sourceId, request));
    }
}
