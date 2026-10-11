package com.aardapeker.app.controller;

import com.aardapeker.app.exception.BadRequestException;
import com.aardapeker.app.exception.ForbiddenActionException;
import com.aardapeker.app.exception.ResourceNotFoundException;
import com.aardapeker.app.model.User;
import com.aardapeker.app.pdf.PdfConfirmRequest;
import com.aardapeker.app.pdf.PdfExtractionService;
import com.aardapeker.app.pdf.PdfSession;
import com.aardapeker.app.pdf.PdfSessionStore;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/files/pdf")
public class PdfImportController {

    @Value("${file.upload.dir:./uploads}")
    private String uploadDir;

    private final PdfExtractionService extractionService;
    private final PdfSessionStore sessionStore;

    public PdfImportController(PdfExtractionService extractionService, PdfSessionStore sessionStore) {
        this.extractionService = extractionService;
        this.sessionStore = sessionStore;
    }

    /**
     * Upload a PDF and start async extraction.
     * Returns sessionId immediately — client polls /status for progress.
     */
    @PostMapping(value = "upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> uploadPdf(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User user) {

        PdfSession session = extractionService.createSession(file, user.getUsername());
        extractionService.extractAsync(session.getSessionId());

        return ResponseEntity.ok(Map.of(
                "sessionId", session.getSessionId(),
                "expiresAt", session.getExpiresAt().toString()
        ));
    }

    /**
     * Poll extraction status and progress.
     */
    @GetMapping("{sessionId}/status")
    public ResponseEntity<Map<String, Object>> getStatus(
            @PathVariable String sessionId,
            @AuthenticationPrincipal User user) {

        PdfSession session = requireOwnedSession(sessionId, user);

        if (session.isExpired()) {
            extractionService.deleteSession(session);
            throw new ResourceNotFoundException("PDF session has expired. Please upload your PDF again.");
        }

        Map<String, Object> body = new java.util.LinkedHashMap<>();
        body.put("status", session.getStatus().name());
        body.put("progressCurrent", session.getProgressCurrent());
        body.put("progressTotal", session.getProgressTotal());
        if (session.getErrorMessage() != null) {
            body.put("error", session.getErrorMessage());
        }
        if (session.getStatus() == PdfSession.Status.DONE) {
            body.put("items", session.getItems());
        }
        return ResponseEntity.ok(body);
    }

    /**
     * Confirm selected images — renders full DPI, saves to blueprints/, cleans up temp.
     * Returns final blueprint URLs.
     */
    @PostMapping("{sessionId}/confirm")
    public ResponseEntity<Map<String, Object>> confirm(
            @PathVariable String sessionId,
            @RequestBody PdfConfirmRequest request,
            @AuthenticationPrincipal User user) {

        PdfSession session = requireOwnedSession(sessionId, user);

        if (session.isExpired()) {
            extractionService.deleteSession(session);
            throw new ResourceNotFoundException("PDF session has expired. Please upload your PDF again.");
        }

        if (session.getStatus() != PdfSession.Status.DONE) {
            throw new BadRequestException("Extraction is not complete yet");
        }

        if (request.selectedIndices() == null || request.selectedIndices().isEmpty()) {
            throw new BadRequestException("No images selected");
        }

        List<String> blueprintUrls = extractionService.confirmSelection(
                session,
                request.selectedIndices(),
                request.names(),
                request.clientUsername()
        );

        return ResponseEntity.ok(Map.of("blueprintUrls", blueprintUrls));
    }

    /**
     * Serve temp thumbnail images — owner-only.
     */
    @GetMapping("{sessionId}/thumbs/{filename}")
    public ResponseEntity<ByteArrayResource> serveThumbnail(
            @PathVariable String sessionId,
            @PathVariable String filename,
            @AuthenticationPrincipal User user,
            HttpServletRequest request) {

        requireOwnedSession(sessionId, user);

        // Prevent path traversal
        if (filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
            throw new BadRequestException("Invalid filename");
        }

        Path thumbPath = Paths.get(uploadDir, "temp", sessionId, "thumbs", filename);

        if (!Files.exists(thumbPath) || !Files.isRegularFile(thumbPath)) {
            throw new ResourceNotFoundException("Thumbnail not found");
        }

        try {
            byte[] content = Files.readAllBytes(thumbPath);
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType("image/png"))
                    .header(HttpHeaders.CACHE_CONTROL, "no-store")
                    .body(new ByteArrayResource(content));
        } catch (IOException e) {
            throw new ResourceNotFoundException("Failed to read thumbnail");
        }
    }

    // --- Private helpers ---

    private PdfSession requireOwnedSession(String sessionId, User user) {
        PdfSession session = sessionStore.get(sessionId);
        if (session == null) {
            throw new ResourceNotFoundException(
                    "Import session not found. Your extracted images may have been cleared. Please upload your PDF again.");
        }
        if (!session.getUsername().equals(user.getUsername())) {
            throw new ForbiddenActionException("Access denied");
        }
        return session;
    }
}
