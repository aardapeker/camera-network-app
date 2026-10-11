package com.aardapeker.app.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateUserPasswordRequest(
    @NotBlank(message = "Current password is required") String currentPassword,

    @NotBlank(message = "New password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    String newPassword
) {
    // static builder method
    public static UpdateUserPasswordRequestBuilder builder() {
        return new UpdateUserPasswordRequestBuilder();
    }

    // static inner builder class
    public static class UpdateUserPasswordRequestBuilder {

        private String currentPassword;
        private String newPassword;

        UpdateUserPasswordRequestBuilder() {}

        public UpdateUserPasswordRequestBuilder currentPassword(
            String currentPassword
        ) {
            this.currentPassword = currentPassword;
            return this;
        }

        public UpdateUserPasswordRequestBuilder newPassword(
            String newPassword
        ) {
            this.newPassword = newPassword;
            return this;
        }

        public UpdateUserPasswordRequest build() {
            return new UpdateUserPasswordRequest(currentPassword, newPassword);
        }
    }
}
