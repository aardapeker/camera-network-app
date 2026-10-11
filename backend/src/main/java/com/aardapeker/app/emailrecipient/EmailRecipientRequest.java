package com.aardapeker.app.emailrecipient;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record EmailRecipientRequest(
        @NotBlank @Email String email,
        String label
) {}
