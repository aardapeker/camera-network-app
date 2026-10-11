package com.aardapeker.app.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "backup_logs")
public class BackupLog {

    public enum BackupType {
        AUTO, MANUAL, RESTORE
    }

    public enum BackupStatus {
        IN_PROGRESS, SUCCESS, FAILED, SKIPPED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BackupType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BackupStatus status;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    // Size of the gzipped DB dump in bytes (null if restore or failed)
    private Long dbSizeBytes;

    // Number of image files uploaded (0 = no changes, null if restore or failed)
    private Integer imagesUploaded;

    // S3 key for the DB dump — used to trigger restore for this specific backup
    @Column(length = 512)
    private String backupKey;

    // Error message if failed, or summary if success
    @Column(columnDefinition = "TEXT")
    private String details;

    public BackupLog() {}

    public BackupLog(
            BackupType type,
            BackupStatus status,
            LocalDateTime timestamp,
            Long dbSizeBytes,
            Integer imagesUploaded,
            String backupKey,
            String details) {
        this.type = type;
        this.status = status;
        this.timestamp = timestamp;
        this.dbSizeBytes = dbSizeBytes;
        this.imagesUploaded = imagesUploaded;
        this.backupKey = backupKey;
        this.details = details;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public BackupType getType() { return type; }
    public void setType(BackupType type) { this.type = type; }

    public BackupStatus getStatus() { return status; }
    public void setStatus(BackupStatus status) { this.status = status; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    public Long getDbSizeBytes() { return dbSizeBytes; }
    public void setDbSizeBytes(Long dbSizeBytes) { this.dbSizeBytes = dbSizeBytes; }

    public Integer getImagesUploaded() { return imagesUploaded; }
    public void setImagesUploaded(Integer imagesUploaded) { this.imagesUploaded = imagesUploaded; }

    public String getBackupKey() { return backupKey; }
    public void setBackupKey(String backupKey) { this.backupKey = backupKey; }

    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }

    public static BackupLogBuilder builder() { return new BackupLogBuilder(); }

    public static class BackupLogBuilder {
        private BackupType type;
        private BackupStatus status;
        private LocalDateTime timestamp;
        private Long dbSizeBytes;
        private Integer imagesUploaded;
        private String backupKey;
        private String details;

        BackupLogBuilder() {}

        public BackupLogBuilder type(BackupType type) { this.type = type; return this; }
        public BackupLogBuilder status(BackupStatus status) { this.status = status; return this; }
        public BackupLogBuilder timestamp(LocalDateTime timestamp) { this.timestamp = timestamp; return this; }
        public BackupLogBuilder dbSizeBytes(Long dbSizeBytes) { this.dbSizeBytes = dbSizeBytes; return this; }
        public BackupLogBuilder imagesUploaded(Integer imagesUploaded) { this.imagesUploaded = imagesUploaded; return this; }
        public BackupLogBuilder backupKey(String backupKey) { this.backupKey = backupKey; return this; }
        public BackupLogBuilder details(String details) { this.details = details; return this; }

        public BackupLog build() {
            return new BackupLog(type, status, timestamp, dbSizeBytes, imagesUploaded, backupKey, details);
        }
    }
}
