package com.aardapeker.app.scheduler;

import com.aardapeker.app.networkscan.NetworkScanService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class ScanDataRetentionCleanupJob {

    private static final Logger log = LoggerFactory.getLogger(ScanDataRetentionCleanupJob.class);

    private final NetworkScanService networkScanService;

    public ScanDataRetentionCleanupJob(NetworkScanService networkScanService) {
        this.networkScanService = networkScanService;
    }

    @Scheduled(cron = "0 0 3 * * *") // Daily at 03:00
    @Transactional
    public void cleanupExpiredScanData() {
        int totalDeleted = 0;

        for (String sourceId : networkScanService.getDistinctSources()) {
            totalDeleted += networkScanService.cleanupExpiredForSource(sourceId);
        }

        if (totalDeleted > 0) {
            log.info("Deleted {} expired network scan rows", totalDeleted);
        }
    }
}
