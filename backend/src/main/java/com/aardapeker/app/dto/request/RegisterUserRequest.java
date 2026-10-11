package com.aardapeker.app.dto.request;

import jakarta.validation.constraints.*;

public record RegisterUserRequest(
        @Size(max = 50) String firstName,

        @Size(max = 50) String lastName,

        @NotBlank @Size(min = 2, max = 30) String username,

        @NotBlank @Email String email,

        @NotBlank @Size(min = 6) String password,

        String profilePictureUrl) {
}
