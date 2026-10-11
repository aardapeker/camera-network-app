package com.aardapeker.app.networkscan;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.time.LocalDateTime;
import java.util.List;

public record ScanBatchRequest(
        @NotBlank String sourceId,
        String subnet,
        LocalDateTime scannedAt,
        @NotEmpty List<@Valid ScanHostRequest> hosts) {
}
