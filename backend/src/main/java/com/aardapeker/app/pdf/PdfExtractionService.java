package com.aardapeker.app.pdf;

import com.aardapeker.app.exception.BadRequestException;
import com.aardapeker.app.exception.FileStorageException;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.cos.COSName;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDResources;
import org.apache.pdfbox.pdmodel.graphics.PDXObject;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.apache.pdfbox.rendering.ImageType;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.UUID;

@Service
public class PdfExtractionService {

    private static final Logger log = LoggerFactory.getLogger(PdfExtractionService.class);

    private static final long MAX_PDF_SIZE = 50L * 1024 * 1024; // 50MB
    private static final int MAX_PAGES = 50;
    private static final float THUMB_DPI = 72f;
    private static final float FULL_DPI = 300f;
    private static final long SESSION_TTL_MINUTES = 30;

    @Value("${file.upload.dir:./uploads}")
    private String uploadDir;

    @Value("${file.base-url}")
    private String baseUrl;

    private final PdfSessionStore sessionStore;

    public PdfExtractionService(PdfSessionStore sessionStore) {
        this.sessionStore = sessionStore;
    }

    public PdfSession createSession(MultipartFile file, String username) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("PDF file is required");
        }
        if (!"application/pdf".equals(file.getContentType())) {
            throw new BadRequestException("Only PDF files are accepted");
        }
        if (file.getSize() > MAX_PDF_SIZE) {
            throw new BadRequestException("PDF file too large. Maximum size is 50MB");
        }

        String sessionId = UUID.randomUUID().toString();
        Path tempDir = Paths.get(uploadDir, "temp", sessionId);

        try {
            Files.createDirectories(tempDir);
            Files.createDirectories(tempDir.resolve("thumbs"));
        } catch (IOException e) {
            throw new FileStorageException("Failed to create temp directory", e);
        }

        Instant expiresAt = Instant.now().plusSeconds(SESSION_TTL_MINUTES * 60);
        PdfSession session = new PdfSession(sessionId, username, tempDir, expiresAt);
        sessionStore.put(session);

        // Save the PDF to temp dir
        Path pdfPath = tempDir.resolve("original.pdf");
        try {
            Files.copy(file.getInputStream(), pdfPath);
        } catch (IOException e) {
            sessionStore.remove(sessionId);
            throw new FileStorageException("Failed to save PDF", e);
        }

        return session;
    }

    @Async
    public void extractAsync(String sessionId) {
        PdfSession session = sessionStore.get(sessionId);
        if (session == null) return;

        session.setStatus(PdfSession.Status.EXTRACTING);

        Path pdfPath = session.getTempDir().resolve("original.pdf");
        Path thumbsDir = session.getTempDir().resolve("thumbs");

        try (PDDocument doc = Loader.loadPDF(pdfPath.toFile())) {
            int pageCount = Math.min(doc.getNumberOfPages(), MAX_PAGES);
            PDFRenderer renderer = new PDFRenderer(doc);

            // Phase 1: render full pages as thumbnails
            int totalWork = pageCount;
            // Count embedded images for progress total
            for (int i = 0; i < pageCount; i++) {
                totalWork += countEmbeddedImages(doc.getPage(i));
            }
            session.setProgress(0, totalWork);

            int itemIndex = 0;
            int done = 0;

            for (int pageIdx = 0; pageIdx < pageCount; pageIdx++) {
                BufferedImage pageImg = renderer.renderImageWithDPI(pageIdx, THUMB_DPI, ImageType.RGB);
                String filename = "page-" + pageIdx + ".png";
                savePng(pageImg, thumbsDir.resolve(filename));

                String thumbUrl = buildTempUrl(sessionId, filename);
                session.addItem(new PdfExtractedItem(
                        itemIndex++,
                        "page",
                        "Page " + (pageIdx + 1),
                        thumbUrl,
                        pageImg.getWidth(),
                        pageImg.getHeight()
                ));
                session.setProgress(++done, totalWork);
            }

            // Phase 2: embedded images
            for (int pageIdx = 0; pageIdx < pageCount; pageIdx++) {
                PDPage page = doc.getPage(pageIdx);
                PDResources resources = page.getResources();
                if (resources == null) continue;

                int embeddedIdx = 0;
                for (COSName name : resources.getXObjectNames()) {
                    PDXObject xobj;
                    try {
                        xobj = resources.getXObject(name);
                    } catch (IOException e) {
                        continue;
                    }
                    if (!(xobj instanceof PDImageXObject image)) continue;

                    BufferedImage img = image.getImage();
                    // Skip very small images (icons, bullets, etc.) — less than 100px on either side
                    if (img.getWidth() < 100 || img.getHeight() < 100) {
                        done++;
                        session.setProgress(done, totalWork);
                        continue;
                    }

                    String filename = "embedded-p" + pageIdx + "-" + embeddedIdx + ".png";
                    savePng(img, thumbsDir.resolve(filename));

                    String thumbUrl = buildTempUrl(sessionId, filename);
                    session.addItem(new PdfExtractedItem(
                            itemIndex++,
                            "embedded",
                            "Image on page " + (pageIdx + 1),
                            thumbUrl,
                            img.getWidth(),
                            img.getHeight()
                    ));
                    embeddedIdx++;
                    session.setProgress(++done, totalWork);
                }
            }

            session.setStatus(PdfSession.Status.DONE);

        } catch (Exception e) {
            log.error("PDF extraction failed for session {}", sessionId, e);
            session.setStatus(PdfSession.Status.FAILED);
            session.setErrorMessage("Failed to extract images from PDF: " + e.getMessage());
        }
    }

    /**
     * Renders the selected items at full DPI and saves them to the blueprints directory.
     * Returns the permanent blueprint URLs.
     */
    public java.util.List<String> confirmSelection(
            PdfSession session,
            java.util.List<Integer> selectedIndices,
            java.util.List<String> names,
            String clientUsername
    ) {
        Path pdfPath = session.getTempDir().resolve("original.pdf");
        java.util.List<String> resultUrls = new java.util.ArrayList<>();

        try (PDDocument doc = Loader.loadPDF(pdfPath.toFile())) {
            PDFRenderer renderer = new PDFRenderer(doc);

            for (int i = 0; i < selectedIndices.size(); i++) {
                int index = selectedIndices.get(i);
                String name = (names != null && i < names.size() && names.get(i) != null && !names.get(i).isBlank())
                        ? sanitizeName(names.get(i))
                        : "blueprint-" + index;

                PdfExtractedItem item = session.getItems().stream()
                        .filter(it -> it.index() == index)
                        .findFirst()
                        .orElseThrow(() -> new BadRequestException("Item index not found: " + index));

                BufferedImage fullImg;

                if ("page".equals(item.type())) {
                    // Re-render page at full DPI
                    int pageIdx = extractPageIndex(item);
                    fullImg = renderer.renderImageWithDPI(pageIdx, FULL_DPI, ImageType.RGB);
                } else {
                    // For embedded images: load from thumb (already full resolution from PDFBox)
                    Path thumbPath = session.getTempDir().resolve("thumbs").resolve(extractFilename(item.thumbnailUrl()));
                    fullImg = ImageIO.read(thumbPath.toFile());
                }

                String blueprintFilename = name + "-" + System.currentTimeMillis() + ".png";
                Path blueprintDir = buildBlueprintDir(clientUsername);
                Files.createDirectories(blueprintDir);
                savePng(fullImg, blueprintDir.resolve(blueprintFilename));

                resultUrls.add(buildBlueprintUrl(clientUsername, blueprintFilename));
            }
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            throw new FileStorageException("Failed to save selected blueprints", e);
        }

        // Delete temp dir
        deleteTempDir(session.getTempDir());
        sessionStore.remove(session.getSessionId());

        return resultUrls;
    }

    public void deleteSession(PdfSession session) {
        deleteTempDir(session.getTempDir());
        sessionStore.remove(session.getSessionId());
    }

    // --- Private helpers ---

    private int countEmbeddedImages(PDPage page) {
        PDResources resources = page.getResources();
        if (resources == null) return 0;
        int count = 0;
        for (COSName name : resources.getXObjectNames()) {
            try {
                if (resources.getXObject(name) instanceof PDImageXObject) count++;
            } catch (IOException ignored) {}
        }
        return count;
    }

    private void savePng(BufferedImage img, Path target) throws IOException {
        try (OutputStream out = Files.newOutputStream(target)) {
            ImageIO.write(img, "png", out);
        }
    }

    private String buildTempUrl(String sessionId, String filename) {
        return baseUrl + "/files/pdf/" + sessionId + "/thumbs/" + filename;
    }

    private Path buildBlueprintDir(String clientUsername) {
        if (clientUsername == null || clientUsername.isBlank()) {
            return Paths.get(uploadDir, "blueprints", "unassigned");
        }
        return Paths.get(uploadDir, "users", clientUsername, "blueprints");
    }

    private String buildBlueprintUrl(String clientUsername, String filename) {
        if (clientUsername == null || clientUsername.isBlank()) {
            return baseUrl + "/files/serve/blueprints/unassigned/" + filename;
        }
        return baseUrl + "/files/serve/users/" + clientUsername + "/blueprints/" + filename;
    }

    private int extractPageIndex(PdfExtractedItem item) {
        // label is "Page N" — parse N-1
        String label = item.label(); // "Page 1"
        try {
            return Integer.parseInt(label.replace("Page ", "").trim()) - 1;
        } catch (NumberFormatException e) {
            return item.index();
        }
    }

    private String extractFilename(String url) {
        return url.substring(url.lastIndexOf('/') + 1);
    }

    private String sanitizeName(String name) {
        return name.trim().replaceAll("[^a-zA-Z0-9\\-_]", "-");
    }

    private void deleteTempDir(Path dir) {
        try {
            if (Files.exists(dir)) {
                try (var stream = Files.walk(dir)) {
                    stream.sorted(java.util.Comparator.reverseOrder())
                            .forEach(p -> {
                                try { Files.delete(p); } catch (IOException ignored) {}
                            });
                }
            }
        } catch (IOException e) {
            log.warn("Failed to delete temp dir: {}", dir, e);
        }
    }
}
