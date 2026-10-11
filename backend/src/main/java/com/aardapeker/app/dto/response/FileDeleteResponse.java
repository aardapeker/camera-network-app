package com.aardapeker.app.dto.response;

public record FileDeleteResponse(
    String message,
    String username,
    String fileName,
    String path
) {
    public static FileDeleteResponse of(
        String username,
        String fileName,
        String path
    ) {
        return new FileDeleteResponse(
            "File deleted successfully",
            username,
            fileName,
            path
        );
    }
}
