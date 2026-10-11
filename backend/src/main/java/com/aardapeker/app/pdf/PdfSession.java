package com.aardapeker.app.pdf;

import java.nio.file.Path;
import java.time.Instant;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

public class PdfSession {

    public enum Status {
        PENDING, EXTRACTING, DONE, FAILED
    }

    private final String sessionId;
    private final String username;
    private final Path tempDir;
    private final Instant expiresAt;

    private volatile Status status = Status.PENDING;
    private volatile String errorMessage;
    private volatile int progressCurrent = 0;
    private volatile int progressTotal = 0;

    private final List<PdfExtractedItem> items = new CopyOnWriteArrayList<>();

    public PdfSession(String sessionId, String username, Path tempDir, Instant expiresAt) {
        this.sessionId = sessionId;
        this.username = username;
        this.tempDir = tempDir;
        this.expiresAt = expiresAt;
    }

    public boolean isExpired() {
        return Instant.now().isAfter(expiresAt);
    }

    // Getters
    public String getSessionId()     { return sessionId; }
    public String getUsername()      { return username; }
    public Path getTempDir()         { return tempDir; }
    public Instant getExpiresAt()    { return expiresAt; }
    public Status getStatus()        { return status; }
    public String getErrorMessage()  { return errorMessage; }
    public int getProgressCurrent()  { return progressCurrent; }
    public int getProgressTotal()    { return progressTotal; }
    public List<PdfExtractedItem> getItems() { return items; }

    // Setters
    public void setStatus(Status status)            { this.status = status; }
    public void setErrorMessage(String msg)         { this.errorMessage = msg; }
    public void setProgress(int current, int total) { this.progressCurrent = current; this.progressTotal = total; }
    public void addItem(PdfExtractedItem item)      { this.items.add(item); }
}
