package com.aardapeker.app.networkscan;

public record ScanAgentSettingsResponse(
        String sourceId,
        int retentionDays,
        int minWriteIntervalSeconds,
        boolean retentionIsDefault,
        boolean intervalIsDefault) {
}
