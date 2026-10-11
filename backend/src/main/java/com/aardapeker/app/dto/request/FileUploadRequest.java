package com.aardapeker.app.dto.request;

import jakarta.validation.constraints.NotNull;
import org.springframework.web.multipart.MultipartFile;

public record FileUploadRequest(
    @NotNull(message = "File is required") MultipartFile file
) {}
