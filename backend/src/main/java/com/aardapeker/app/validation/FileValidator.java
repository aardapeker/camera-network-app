package com.aardapeker.app.validation;

import com.aardapeker.app.exception.BadRequestException;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

@Component
public class FileValidator {

    private static final long MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    private static final String[] ALLOWED_CONTENT_TYPES = {
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
    };

    public void validateFileForUpload(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException(
                "File is required and cannot be empty"
            );
        }

        validateFileSize(file);
        validateFileType(file);
    }

    private void validateFileSize(MultipartFile file) {
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BadRequestException(
                "File size too large. Maximum file size is 50MB"
            );
        }
    }

    private void validateFileType(MultipartFile file) {
        String contentType = file.getContentType();

        if (contentType == null) {
            throw new BadRequestException("File content type is missing");
        }

        boolean isValidType = false;
        for (String allowedType : ALLOWED_CONTENT_TYPES) {
            if (contentType.equals(allowedType)) {
                isValidType = true;
                break;
            }
        }

        if (!isValidType) {
            throw new BadRequestException(
                "Invalid file type. Only image files (JPEG, PNG, GIF, WebP) are allowed"
            );
        }
    }

    public void validateFileName(String fileName) {
        if (fileName == null || fileName.isBlank()) {
            throw new BadRequestException("File name is required");
        }
        if (fileName.contains("..") || fileName.contains("//")) {
            throw new BadRequestException("Invalid file name");
        }
    }
}
