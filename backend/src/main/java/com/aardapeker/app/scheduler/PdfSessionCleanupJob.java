package com.aardapeker.app.scheduler;

import com.aardapeker.app.pdf.PdfExtractionService;
import com.aardapeker.app.pdf.PdfSession;
import com.aardapeker.app.pdf.PdfSessionStore;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Comparator;

@Component
public class PdfSessionCleanupJob {

    private static final Logger log = LoggerFactory.getLogger(PdfSessionCleanupJob.class);

    @Value("${file.upload.dir:./uploads}")
    private String uploadDir;

    private final PdfSessionStore sessionStore;
    private final PdfExtractionService extractionService;

    public PdfSessionCleanupJob(PdfSessionStore sessionStore, PdfExtractionService extractionService) {
        this.sessionStore = sessionStore;
        this.extractionService = extractionService;
    }

    /**
     * Every 5 minutes: remove expired in-memory sessions and their temp dirs.
     */
    @Scheduled(fixedRate = 5 * 60 * 1000)
    public void cleanupExpiredSessions() {
        int removed = 0;
        for (PdfSession session : sessionStore.all()) {
            if (session.isExpired()) {
                extractionService.deleteSession(session);
                removed++;
            }
        }
        if (removed > 0) {
            log.info("Cleaned up {} expired PDF import sessions", removed);
        }
    }

    /**
     * On startup: sweep any leftover temp dirs from a previous JVM run (crash recovery).
     */
    @PostConstruct
    public void cleanupOrphanedTempDirs() {
        Path tempBase = Paths.get(uploadDir, "temp");
        if (!Files.exists(tempBase)) return;

        try (var stream = Files.list(tempBase)) {
            stream.filter(Files::isDirectory).forEach(dir -> {
                // If it's not tracked in the current session store, delete it
                String sessionId = dir.getFileName().toString();
                if (sessionStore.get(sessionId) == null) {
                    deleteDir(dir);
                    log.info("Deleted orphaned PDF temp dir: {}", sessionId);
                }
            });
        } catch (IOException e) {
            log.warn("Failed to scan temp dir for orphaned sessions", e);
        }
    }

    private void deleteDir(Path dir) {
        try (var stream = Files.walk(dir)) {
            stream.sorted(Comparator.reverseOrder())
                    .forEach(p -> {
                        try { Files.delete(p); } catch (IOException ignored) {}
                    });
        } catch (IOException e) {
            log.warn("Failed to delete dir: {}", dir, e);
        }
    }
}
