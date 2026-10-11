package com.aardapeker.app.dto.response;

import com.aardapeker.app.model.BackupLog;
import java.time.LocalDateTime;
import java.util.UUID;

public class BackupLogResponse {

    private UUID id;
    private String type;
    private String status;
    private LocalDateTime timestamp;
    private String dbSize;
    private Integer imagesUploaded;
    private String backupKey;
    private String details;

    public BackupLogResponse() {}

    public static BackupLogResponse from(BackupLog log) {
        BackupLogResponse r = new BackupLogResponse();
        r.id = log.getId();
        r.type = log.getType().name();
        r.status = log.getStatus().name();
        r.timestamp = log.getTimestamp();
        r.dbSize = log.getDbSizeBytes() != null ? formatSize(log.getDbSizeBytes()) : null;
        r.imagesUploaded = log.getImagesUploaded();
        r.backupKey = log.getBackupKey();
        r.details = log.getDetails();
        return r;
    }

    private static String formatSize(long bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format("%.1f KB", bytes / 1024.0);
        return String.format("%.1f MB", bytes / (1024.0 * 1024));
    }

    public UUID getId() { return id; }
    public String getType() { return type; }
    public String getStatus() { return status; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public String getDbSize() { return dbSize; }
    public Integer getImagesUploaded() { return imagesUploaded; }
    public String getBackupKey() { return backupKey; }
    public String getDetails() { return details; }
}
