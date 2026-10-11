package com.aardapeker.app.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record VerifyUserRequest(
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    String email,
    @NotBlank(message = "Code is required")
    @Size(min = 6, max = 6, message = "Verification code must be 6 characters")
    String verificationCode
) {}
