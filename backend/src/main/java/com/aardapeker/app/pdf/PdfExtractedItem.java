package com.aardapeker.app.pdf;

public record PdfExtractedItem(
        int index,
        String type,       // "page" or "embedded"
        String label,      // e.g. "Page 1" or "Embedded image 3"
        String thumbnailUrl,
        int width,
        int height
) {}
