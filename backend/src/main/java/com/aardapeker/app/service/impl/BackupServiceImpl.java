package com.aardapeker.app.service.impl;

import com.aardapeker.app.dto.response.BackupLogResponse;
import com.aardapeker.app.model.BackupLog;
import com.aardapeker.app.model.BackupLog.BackupStatus;
import com.aardapeker.app.model.BackupLog.BackupType;
import com.aardapeker.app.repository.BackupLogRepository;
import com.aardapeker.app.service.BackupService;
import jakarta.annotation.PostConstruct;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.FileStore;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.stream.Stream;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Request;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Response;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Object;

/**
 * Backup and restore service backed by AWS S3.
 *
 * <h2>S3 layout</h2>
 * <pre>
 *   db/backup-YYYY-MM-DDTHH-mm.sql.gz   — pg_dump in custom compressed format
 *   images/&lt;relative-path&gt;              — uploaded image files (incremental)
 * </pre>
 *
 * <h2>Backup strategy</h2>
 * <ul>
 *   <li>AUTO — runs every day at midnight via {@code @Scheduled} cron</li>
 *   <li>MANUAL — triggered by an admin from the UI</li>
 *   <li>Images are uploaded incrementally: only files modified since the last
 *       successful backup are uploaded. On first run or after a restore, all
 *       images are uploaded.</li>
 *   <li>Old DB dumps are pruned to keep the last {@code aws.s3.keep-last} (default 30).</li>
 * </ul>
 *
 * <h2>Restore strategy</h2>
 * <ol>
 *   <li>Downloads the selected DB dump from S3 and runs {@code pg_restore --clean}.</li>
 *   <li>Downloads all images from S3, overwriting local files.</li>
 *   <li>Writes a RESTORE log entry into the freshly restored DB.</li>
 *   <li>Redirects the user to sign-in (DB wipe invalidates all sessions).</li>
 * </ol>
 *
 * <h2>Log visibility rule</h2>
 * Only entries with a non-null {@code backupKey} are shown in the UI. This means
 * FAILED and SKIPPED entries are invisible (no S3 file to restore from). On
 * {@code getLogs()}, any S3 dump not yet in the local DB is persisted immediately
 * so it survives future restores without disappearing.
 *
 * <h2>Startup</h2>
 * Any {@code IN_PROGRESS} logs left over from a crash or restore wipe are
 * marked as FAILED on {@code @PostConstruct}.
 */
@Service
public class BackupServiceImpl implements BackupService {

    private static final Logger log = LoggerFactory.getLogger(BackupServiceImpl.class);
    private static final DateTimeFormatter TIMESTAMP_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH-mm");
    private static final String DB_PREFIX = "db/";
    private static final String IMAGES_PREFIX = "images/";

    @Value("${aws.s3.bucket}")
    private String bucket;

    @Value("${aws.s3.region}")
    private String region;

    @Value("${aws.credentials.access-key}")
    private String accessKey;

    @Value("${aws.credentials.secret-key}")
    private String secretKey;

    @Value("${aws.s3.keep-last:30}")
    private int keepLast;

    @Value("${file.upload.dir:./uploads}")
    private String uploadDir;

    @Value("${backup.pgdump.path:pg_dump}")
    private String pgDumpPath;

    @Value("${spring.datasource.url}")
    private String datasourceUrl;

    @Value("${spring.datasource.username}")
    private String datasourceUsername;

    @Value("${spring.datasource.password:}")
    private String datasourcePassword;

    private final BackupLogRepository backupLogRepository;
    private final AtomicBoolean backupInProgress = new AtomicBoolean(false);

    // Tracks last backup time for incremental image uploads
    private LocalDateTime lastBackupTimestamp = null;

    private S3Client s3Client;

    public BackupServiceImpl(BackupLogRepository backupLogRepository) {
        this.backupLogRepository = backupLogRepository;
    }

    @PostConstruct
    public void initS3Client() {
        // Mark any stuck IN_PROGRESS logs as FAILED (e.g. from a crash or restore wipe)
        List<BackupLog> stuck = backupLogRepository.findAllByStatus(BackupStatus.IN_PROGRESS);
        if (!stuck.isEmpty()) {
            stuck.forEach(l -> {
                l.setStatus(BackupStatus.FAILED);
                l.setDetails("Interrupted (server restarted)");
            });
            backupLogRepository.saveAll(stuck);
            log.info("Marked {} stuck IN_PROGRESS backup log(s) as FAILED.", stuck.size());
        }

        // If credentials are not configured, skip S3 client init.
        // isS3Healthy() will return false and the UI will show a warning banner.
        if (accessKey == null || accessKey.isBlank() || secretKey == null || secretKey.isBlank()) {
            log.warn("AWS credentials are not configured. Backup/restore features will be unavailable.");
            return;
        }
        s3Client = S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKey, secretKey)))
                .build();
    }

    // ===================== SCHEDULED AUTO BACKUP =====================

    @Scheduled(cron = "0 0 0 * * *") // Every day at midnight
    public void scheduledBackup() {
        log.info("Starting scheduled auto backup...");
        runBackup(BackupType.AUTO);
    }

    // ===================== PUBLIC API =====================

    @Override
    public BackupLog createBackup() {
        if (backupInProgress.get()) {
            BackupLog rejected = BackupLog.builder()
                    .type(BackupType.MANUAL)
                    .status(BackupStatus.SKIPPED)
                    .timestamp(LocalDateTime.now())
                    .details("Backup already in progress, try again later.")
                    .build();
            return backupLogRepository.save(rejected);
        }
        return runBackup(BackupType.MANUAL);
    }

    @Override
    public BackupLog restoreBackup(String backupKey) {
        LocalDateTime startedAt = LocalDateTime.now();
        BackupLog restoreLog = BackupLog.builder()
                .type(BackupType.RESTORE)
                .status(BackupStatus.IN_PROGRESS)
                .timestamp(startedAt)
                .details("Restoring from backup: " + backupKey)
                .build();

        try {
            // 1. Check disk space before downloading
            checkDiskSpace();

            // 2. Restore DB (wipes existing data including any previously saved log)
            restoreDatabase(backupKey);

            // 3. Restore images
            restoreImages();

            // 4. Reset lastBackupTimestamp so next incremental re-uploads all images
            lastBackupTimestamp = null;

            restoreLog.setStatus(BackupStatus.SUCCESS);
            restoreLog.setBackupKey(backupKey);
            restoreLog.setDetails("Restored from backup: " + backupKey);
        } catch (Exception e) {
            log.error("Restore failed", e);
            restoreLog.setStatus(BackupStatus.FAILED);
            restoreLog.setDetails("Restore failed: " + e.getMessage());
        }

        // Save AFTER the DB restore so the log is written into the restored DB,
        // not wiped along with the old data.
        backupLogRepository.save(restoreLog);

        return restoreLog;
    }

    @Override
    public List<BackupLogResponse> getLogs() {
        List<BackupLog> localLogs = backupLogRepository.findAllByOrderByTimestampDesc();

        List<BackupLogResponse> result = new ArrayList<>();

        // Add local DB logs that have an S3 key, deduplicating by key
        Set<String> addedKeys = new HashSet<>();
        for (BackupLog l : localLogs) {
            if (l.getBackupKey() != null && addedKeys.add(l.getBackupKey())) {
                result.add(BackupLogResponse.from(l));
            }
        }

        // Add S3 dumps not tracked in local DB (disaster recovery scenario) and persist them
        // so they survive future restores without disappearing.
        if (s3Client != null) {
            try {
                ListObjectsV2Response s3Response = s3Client.listObjectsV2(
                        ListObjectsV2Request.builder()
                                .bucket(bucket)
                                .prefix(DB_PREFIX)
                                .build());

                List<BackupLog> toSave = new ArrayList<>();
                for (S3Object obj : s3Response.contents()) {
                    if (addedKeys.add(obj.key())) {
                        LocalDateTime ts = LocalDateTime.ofInstant(obj.lastModified(), ZoneId.systemDefault());
                        BackupLog imported = BackupLog.builder()
                                .type(BackupType.AUTO)
                                .status(BackupStatus.SUCCESS)
                                .timestamp(ts)
                                .backupKey(obj.key())
                                .dbSizeBytes(obj.size())
                                .build();
                        toSave.add(imported);
                        result.add(BackupLogResponse.from(imported));
                    }
                }
                if (!toSave.isEmpty()) {
                    backupLogRepository.saveAll(toSave);
                }
            } catch (Exception e) {
                log.warn("Could not list S3 backups for merge: {}", e.getMessage());
            }
        }

        // Sort all entries by timestamp descending
        result.sort(Comparator.comparing(BackupLogResponse::getTimestamp).reversed());

        return result;
    }

    @Override
    public boolean isS3Healthy() {
        if (s3Client == null) return false;
        try {
            s3Client.headBucket(HeadBucketRequest.builder().bucket(bucket).build());
            return true;
        } catch (Exception e) {
            log.warn("S3 health check failed: {}", e.getMessage());
            return false;
        }
    }

    // ===================== BACKUP LOGIC =====================

    private BackupLog runBackup(BackupType type) {
        if (s3Client == null) {
            // Not persisted — no backupKey means it would be invisible in getLogs() anyway
            return BackupLog.builder()
                    .type(type)
                    .status(BackupStatus.FAILED)
                    .timestamp(LocalDateTime.now())
                    .details("AWS credentials are not configured.")
                    .build();
        }
        backupInProgress.set(true);

        // Saved early so IN_PROGRESS is visible in logs during long-running backup.
        // On failure, backupKey remains null so getLogs() filters it out automatically.
        BackupLog backupLog = BackupLog.builder()
                .type(type)
                .status(BackupStatus.IN_PROGRESS)
                .timestamp(LocalDateTime.now())
                .build();
        backupLog = backupLogRepository.save(backupLog);

        File dumpFile = null;
        try {
            String timestamp = LocalDateTime.now().format(TIMESTAMP_FMT);

            // 1. Run pg_dump and upload DB
            dumpFile = runPgDump(timestamp);
            String dbKey = DB_PREFIX + "backup-" + timestamp + ".sql.gz";
            uploadToS3(dbKey, dumpFile);
            long dbSize = dumpFile.length();

            // 2. Upload only changed/new images (incremental)
            int imagesUploaded = uploadChangedImages();

            // 3. Prune old DB dumps — keep only last N
            pruneOldDbDumps();

            // 4. Update last backup timestamp
            lastBackupTimestamp = LocalDateTime.now();

            backupLog.setStatus(BackupStatus.SUCCESS);
            backupLog.setDbSizeBytes(dbSize);
            backupLog.setImagesUploaded(imagesUploaded);
            backupLog.setBackupKey(dbKey);

        } catch (Exception e) {
            log.error("Backup failed", e);
            backupLog.setStatus(BackupStatus.FAILED);
            backupLog.setDetails("Backup failed: " + e.getMessage());
        } finally {
            if (dumpFile != null && dumpFile.exists()) {
                dumpFile.delete();
            }
            backupInProgress.set(false);
        }

        return backupLogRepository.save(backupLog);
    }

    private File runPgDump(String timestamp) throws IOException, InterruptedException {
        // Parse JDBC URL: jdbc:postgresql://host:port/dbname
        String jdbcUrl = datasourceUrl.replace("jdbc:postgresql://", "");
        String[] hostAndDb = jdbcUrl.split("/");
        String[] hostPort = hostAndDb[0].split(":");
        String host = hostPort[0];
        String port = hostPort.length > 1 ? hostPort[1] : "5432";
        String dbName = hostAndDb[1];

        File dumpFile = File.createTempFile("backup-" + timestamp, ".sql.gz");

        ProcessBuilder pb = new ProcessBuilder(
                pgDumpPath,
                "-h", host,
                "-p", port,
                "-U", datasourceUsername,
                "-F", "c", // custom format (compressed)
                "-f", dumpFile.getAbsolutePath(),
                dbName);

        pb.environment().put("PGPASSWORD", datasourcePassword);
        pb.redirectErrorStream(true);

        Process process = pb.start();
        int exitCode = process.waitFor();

        if (exitCode != 0) {
            String output = new String(process.getInputStream().readAllBytes());
            throw new IOException("pg_dump failed (exit " + exitCode + "): " + output);
        }

        return dumpFile;
    }

    private int uploadChangedImages() throws IOException {
        Path uploadsPath = Paths.get(uploadDir);
        if (!Files.exists(uploadsPath)) {
            return 0;
        }

        List<Path> changedFiles = new ArrayList<>();

        try (Stream<Path> stream = Files.walk(uploadsPath)) {
            stream.filter(Files::isRegularFile).forEach(filePath -> {
                try {
                    // If no previous backup, upload everything (first run or after restore)
                    if (lastBackupTimestamp == null) {
                        changedFiles.add(filePath);
                        return;
                    }
                    LocalDateTime fileModified = Files.getLastModifiedTime(filePath)
                            .toInstant()
                            .atZone(java.time.ZoneId.systemDefault())
                            .toLocalDateTime();
                    if (fileModified.isAfter(lastBackupTimestamp)) {
                        changedFiles.add(filePath);
                    }
                } catch (IOException e) {
                    log.warn("Could not check modification time for {}", filePath, e);
                }
            });
        }

        for (Path filePath : changedFiles) {
            String relativePath = Paths.get(uploadDir).relativize(filePath).toString()
                    .replace("\\", "/");
            String s3Key = IMAGES_PREFIX + relativePath;
            uploadToS3(s3Key, filePath.toFile());
        }

        return changedFiles.size();
    }

    private void pruneOldDbDumps() {
        ListObjectsV2Response response = s3Client.listObjectsV2(
                ListObjectsV2Request.builder()
                        .bucket(bucket)
                        .prefix(DB_PREFIX)
                        .build());

        List<S3Object> dumps = response.contents().stream()
                .sorted(Comparator.comparing(S3Object::lastModified))
                .toList();

        if (dumps.size() > keepLast) {
            List<S3Object> toDelete = dumps.subList(0, dumps.size() - keepLast);
            for (S3Object obj : toDelete) {
                s3Client.deleteObject(DeleteObjectRequest.builder()
                        .bucket(bucket)
                        .key(obj.key())
                        .build());
                log.info("Pruned old backup: {}", obj.key());
            }
        }
    }

    // ===================== RESTORE LOGIC =====================

    private void restoreDatabase(String dbKey) throws IOException, InterruptedException {
        // Parse connection details
        String jdbcUrl = datasourceUrl.replace("jdbc:postgresql://", "");
        String[] hostAndDb = jdbcUrl.split("/");
        String[] hostPort = hostAndDb[0].split(":");
        String host = hostPort[0];
        String port = hostPort.length > 1 ? hostPort[1] : "5432";
        String dbName = hostAndDb[1];

        // Download dump from S3 to temp file
        File dumpFile = File.createTempFile("restore-", ".sql.gz");
        try {
            InputStream s3Stream = s3Client.getObject(GetObjectRequest.builder()
                    .bucket(bucket)
                    .key(dbKey)
                    .build());
            Files.copy(s3Stream, dumpFile.toPath(), StandardCopyOption.REPLACE_EXISTING);

            // Step 1: Drop the public schema entirely and recreate it.
            // This avoids FK-ordering issues that plague --clean on a live schema.
            runPsql(host, port, datasourceUsername, dbName,
                    "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO " + datasourceUsername + ";");

            // Step 2: Restore into the clean schema
            ProcessBuilder pb = new ProcessBuilder(
                    "pg_restore",
                    "-h", host,
                    "-p", port,
                    "-U", datasourceUsername,
                    "-d", dbName,
                    "--no-owner",
                    "--no-acl",
                    dumpFile.getAbsolutePath());

            pb.environment().put("PGPASSWORD", datasourcePassword);
            pb.redirectErrorStream(true);

            Process process = pb.start();
            String output = new String(process.getInputStream().readAllBytes());
            int exitCode = process.waitFor();

            if (exitCode != 0) {
                throw new IOException("pg_restore failed (exit " + exitCode + "): " + output);
            }
        } finally {
            dumpFile.delete();
        }
    }

    private void runPsql(String host, String port, String user, String dbName, String sql)
            throws IOException, InterruptedException {
        ProcessBuilder pb = new ProcessBuilder(
                "psql",
                "-h", host,
                "-p", port,
                "-U", user,
                "-d", dbName,
                "-c", sql);
        pb.environment().put("PGPASSWORD", datasourcePassword);
        pb.redirectErrorStream(true);
        Process process = pb.start();
        String output = new String(process.getInputStream().readAllBytes());
        int exitCode = process.waitFor();
        if (exitCode != 0) {
            throw new IOException("psql command failed (exit " + exitCode + "): " + output);
        }
    }

    private void restoreImages() throws IOException {
        // List all images in S3
        ListObjectsV2Response response = s3Client.listObjectsV2(
                ListObjectsV2Request.builder()
                        .bucket(bucket)
                        .prefix(IMAGES_PREFIX)
                        .build());

        for (S3Object obj : response.contents()) {
            // Strip the "images/" prefix to get the relative path
            String relativePath = obj.key().substring(IMAGES_PREFIX.length());
            Path localPath = Paths.get(uploadDir, relativePath);

            Files.createDirectories(localPath.getParent());

            InputStream s3Stream = s3Client.getObject(GetObjectRequest.builder()
                    .bucket(bucket)
                    .key(obj.key())
                    .build());
            Files.copy(s3Stream, localPath, StandardCopyOption.REPLACE_EXISTING);
        }
    }

    private void checkDiskSpace() throws IOException {
        Path uploadsPath = Paths.get(uploadDir);
        if (!Files.exists(uploadsPath)) {
            Files.createDirectories(uploadsPath);
        }
        FileStore store = Files.getFileStore(uploadsPath);
        long freeSpace = store.getUsableSpace();
        long minimumRequired = 500L * 1024 * 1024; // 500 MB minimum

        if (freeSpace < minimumRequired) {
            throw new IOException(String.format(
                    "Insufficient disk space for restore. Available: %s, Required: at least 500MB",
                    formatSize(freeSpace)));
        }
    }

    // ===================== HELPERS =====================

    private void uploadToS3(String key, File file) {
        s3Client.putObject(
                PutObjectRequest.builder()
                        .bucket(bucket)
                        .key(key)
                        .build(),
                RequestBody.fromFile(file));
    }

    private String formatSize(long bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format("%.1f KB", bytes / 1024.0);
        return String.format("%.1f MB", bytes / (1024.0 * 1024));
    }
}
