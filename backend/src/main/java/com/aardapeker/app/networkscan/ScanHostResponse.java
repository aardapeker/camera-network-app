package com.aardapeker.app.networkscan;

import java.time.LocalDateTime;
import java.util.UUID;

public record ScanHostResponse(
        UUID id,
        UUID scanBatchId,
        String sourceId,
        String subnet,
        LocalDateTime scannedAt,
        String ip,
        String mac,
        String vendor,
        String hostname,
        String openPorts,
        LocalDateTime createdAt) {

    public static ScanHostResponse from(ScanHost h) {
        return new ScanHostResponse(
                h.getId(),
                h.getScanBatchId(),
                h.getSourceId(),
                h.getSubnet(),
                h.getScannedAt(),
                h.getIpAddress(),
                h.getMacAddress(),
                h.getVendor(),
                h.getHostname(),
                h.getOpenPorts(),
                h.getCreatedAt());
    }
}
