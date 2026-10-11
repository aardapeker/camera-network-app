package com.aardapeker.app.storage;

import com.aardapeker.app.model.Topology;
import com.aardapeker.app.repository.TopologyRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Stream;

@Service
public class StorageAdminService {

    @Value("${file.upload.dir:./uploads}")
    private String uploadDir;

    @Value("${file.base-url}")
    private String baseUrl;

    private final TopologyRepository topologyRepository;

    public StorageAdminService(TopologyRepository topologyRepository) {
        this.topologyRepository = topologyRepository;
    }

    public StorageStats getStats() {
        List<BlueprintFileInfo> blueprints = listBlueprints();
        int blueprintCount = blueprints.size();
        long blueprintsTotalBytes = blueprints.stream().mapToLong(BlueprintFileInfo::sizeBytes).sum();
        int orphanedCount = (int) blueprints.stream().filter(BlueprintFileInfo::orphaned).count();
        long orphanedTotalBytes = blueprints.stream()
                .filter(BlueprintFileInfo::orphaned)
                .mapToLong(BlueprintFileInfo::sizeBytes)
                .sum();

        return new StorageStats(blueprintCount, blueprintsTotalBytes, orphanedCount, orphanedTotalBytes);
    }

    public List<BlueprintFileInfo> listBlueprints() {
        // Collect all topology blueprint URLs from DB (lightweight query)
        List<Topology> topologies = topologyRepository.findAllWithBlueprintUrls();
        // Map: serveUrl path segment → topology
        Map<String, Topology> urlToTopology = new HashMap<>();
        for (Topology t : topologies) {
            if (t.getBlueprintPictureUrl() != null && !t.getBlueprintPictureUrl().isBlank()) {
                String key = normalizeBlueprintUrl(t.getBlueprintPictureUrl());
                urlToTopology.put(key, t);
            }
        }

        List<BlueprintFileInfo> result = new ArrayList<>();

        // Walk blueprints directories
        walkBlueprintDir("blueprints", result, urlToTopology);
        walkBlueprintDir("users", result, urlToTopology);

        return result;
    }

    public void deleteBlueprints(List<String> relativePaths) {
        for (String rel : relativePaths) {
            // Safety: never allow traversal
            if (rel.contains("..") || rel.contains("//")) continue;
            Path path = Paths.get(uploadDir, rel);
            try {
                Files.deleteIfExists(path);
            } catch (IOException ignored) {
            }
        }
    }

    public void deleteOrphaned() {
        listBlueprints().stream()
                .filter(BlueprintFileInfo::orphaned)
                .forEach(b -> deleteBlueprints(List.of(b.relativePath())));
    }

    // --- private helpers ---

    private void walkBlueprintDir(String subDir, List<BlueprintFileInfo> result,
                                   Map<String, Topology> urlToTopology) {
        Path base = Paths.get(uploadDir, subDir);
        if (!Files.exists(base)) return;

        try (Stream<Path> stream = Files.walk(base)) {
            stream.filter(Files::isRegularFile)
                    .filter(p -> isImageFile(p.getFileName().toString()))
                    // exclude temp/pdf directories
                    .filter(p -> !p.toString().replace("\\", "/").contains("/temp/"))
                    // only blueprint files (not profile pictures)
                    .filter(p -> {
                        String rel = Paths.get(uploadDir).relativize(p).toString().replace("\\", "/");
                        return rel.contains("blueprint") || rel.startsWith("blueprints/");
                    })
                    .forEach(p -> {
                        String rel = Paths.get(uploadDir).relativize(p).toString().replace("\\", "/");
                        String serveUrl = baseUrl + "/files/serve/" + rel;
                        String key = rel;
                        long size = 0;
                        try { size = Files.size(p); } catch (IOException ignored) {}

                        Topology t = urlToTopology.get(key);
                        boolean orphaned = (t == null);

                        String topologyId = null;
                        String topologyName = null;
                        String clientUsername = null;
                        if (t != null) {
                            topologyId = t.getId();
                            topologyName = t.getName();
                            if (t.getClients() != null && !t.getClients().isEmpty()) {
                                clientUsername = t.getClients().stream()
                                        .map(u -> u.getUsername())
                                        .collect(java.util.stream.Collectors.joining(", "));
                            }
                        }

                        result.add(new BlueprintFileInfo(rel, serveUrl, size, orphaned,
                                topologyId, topologyName, clientUsername));
                    });
        } catch (IOException ignored) {
        }
    }

    private String normalizeBlueprintUrl(String url) {
        // URL format: {baseUrl}/files/serve/{relativePath}
        final String SERVE_SEGMENT = "/files/serve/";
        int idx = url.indexOf(SERVE_SEGMENT);
        if (idx == -1) return url;
        return url.substring(idx + SERVE_SEGMENT.length());
    }

    private boolean isImageFile(String filename) {
        String lower = filename.toLowerCase();
        return lower.endsWith(".png") || lower.endsWith(".jpg")
                || lower.endsWith(".jpeg") || lower.endsWith(".gif")
                || lower.endsWith(".webp");
    }
}
