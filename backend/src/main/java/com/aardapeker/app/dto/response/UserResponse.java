package com.aardapeker.app.dto.response;

import com.aardapeker.app.model.Role;
import com.aardapeker.app.model.Status;
import java.util.Set;
import java.util.UUID;

public record UserResponse(
        UUID id,
        String username,
        String firstName,
        String lastName,
        String email,
        String profilePictureUrl,
        Set<Role> authorities,
        Status status,
        String createdAt) {
}
