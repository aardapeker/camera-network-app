package com.aardapeker.app.storage;

public record StorageStats(
        int blueprintCount,
        long blueprintsTotalBytes,
        int orphanedCount,
        long orphanedTotalBytes
) {}
