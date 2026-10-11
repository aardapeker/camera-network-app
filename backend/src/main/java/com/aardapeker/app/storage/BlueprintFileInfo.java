package com.aardapeker.app.storage;

public record BlueprintFileInfo(
        String relativePath,
        String serveUrl,
        long sizeBytes,
        boolean orphaned,
        String topologyId,
        String topologyName,
        String clientUsername
) {}
