package com.aardapeker.app.networkscan;

public record ScanAgentSettingsRequest(
        Integer retentionDays,
        Integer minWriteIntervalSeconds) {
}
