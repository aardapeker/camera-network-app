package com.aardapeker.app.dto.response;

public record FileUploadResponse(
    String message,
    String username,
    String profilePictureUrl,
    String fileName,
    long fileSize,
    String contentType
) {
    public static FileUploadResponse of(
        String username,
        String profilePictureUrl,
        String fileName,
        long fileSize,
        String contentType
    ) {
        return new FileUploadResponse(
            "File uploaded successfully",
            username,
            profilePictureUrl,
            fileName,
            fileSize,
            contentType
        );
    }
}
