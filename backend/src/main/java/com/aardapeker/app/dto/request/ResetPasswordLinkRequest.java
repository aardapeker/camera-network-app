package com.aardapeker.app.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record ResetPasswordLinkRequest(
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email")
    String email
) {}
