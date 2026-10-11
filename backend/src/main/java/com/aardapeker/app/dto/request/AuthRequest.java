package com.aardapeker.app.dto.request;

import jakarta.validation.constraints.NotBlank;

public record AuthRequest(
    @NotBlank(message = "Username or email is required") String identifier,
    @NotBlank(message = "Password is required") String password
) {}
