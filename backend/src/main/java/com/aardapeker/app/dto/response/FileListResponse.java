package com.aardapeker.app.dto.response;

import java.util.List;

public record FileListResponse(String message, List<String> files, int count) {
    public static FileListResponse of(List<String> files) {
        return new FileListResponse(
            "Files retrieved successfully",
            files,
            files.size()
        );
    }
}
