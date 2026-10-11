package com.aardapeker.app.dto.response;

public record BlueprintUploadResponse(
    String message,
    String username,
    String blueprintPictureUrl,
    String fileName,
    long fileSize,
    String contentType
) {
    public static BlueprintUploadResponse of(
        String username,
        String blueprintPictureUrl,
        String fileName,
        long fileSize,
        String contentType
    ) {
        return new BlueprintUploadResponse(
            "Blueprint uploaded successfully",
            username,
            blueprintPictureUrl,
            fileName,
            fileSize,
            contentType
        );
    }
}
