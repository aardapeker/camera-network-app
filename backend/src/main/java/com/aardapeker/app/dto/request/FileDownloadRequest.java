package com.aardapeker.app.dto.request;

import jakarta.validation.constraints.NotBlank;

public record FileDownloadRequest(
    @NotBlank(message = "File name is required and cannot be empty")
    String fileName
) {}
