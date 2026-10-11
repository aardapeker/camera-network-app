package com.aardapeker.app.dto;

public record ServerMetrics(
        Long heapUsedBytes,
        Long heapMaxBytes,
        Double systemCpuUsage,
        Double processCpuUsage,
        Double processUptimeSeconds,
        Long diskFreeBytes,
        Long diskTotalBytes,
        Integer liveThreads,
        Long httpRequestCount,
        Long ramTotalBytes,
        Long ramUsedBytes
) {}
