package com.aardapeker.app.service;

import com.aardapeker.app.dto.response.BackupLogResponse;
import com.aardapeker.app.model.BackupLog;
import java.util.List;

public interface BackupService {

    /** Trigger a manual backup: pg_dump → S3, then incremental image upload. */
    BackupLog createBackup();

    /**
     * Restore from a specific S3 dump key.
     * Wipes the current DB with pg_restore --clean, then downloads all images from S3.
     * The restore log entry is saved into the freshly restored DB so it persists.
     */
    BackupLog restoreBackup(String backupKey);

    /**
     * Returns all backup entries visible in the UI (only entries with a backupKey).
     * Any S3 dump not yet tracked in the local DB is persisted on first call
     * so it survives future restores.
     */
    List<BackupLogResponse> getLogs();

    /** Returns true if the S3 bucket is reachable with the configured credentials. */
    boolean isS3Healthy();
}
