package com.aardapeker.app.dto.response;

import com.aardapeker.app.model.User;
import java.util.UUID;

public record RestrictedUserResponse(
    UUID id,
    String username,
    String firstName,
    String lastName,
    String email,
    String message
) {
    public static RestrictedUserResponse from(User user, String message) {
        return new RestrictedUserResponse(
            user.getId(),
            user.getUsername(),
            user.getFirstName(),
            user.getLastName(),
            user.getEmail(),
            message
        );
    }
}
