package com.aardapeker.app.dto.request;

import jakarta.validation.constraints.NotBlank;

public record SearchLoginAttemptsRequest(
    @NotBlank(message = "Email or username is required") String identifier,
    Integer page,
    Integer size
) {
    public SearchLoginAttemptsRequest {
        page = (page == null || page < 0) ? 0 : page;
        size = (size == null || size <= 0) ? 20 : size;
    }
}
