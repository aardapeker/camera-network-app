package com.aardapeker.app.dto.response;

import com.aardapeker.app.model.CustomPermission;
import java.util.Set;

public record GetMeResponse(
    String email,
    String firstName,
    String lastName,
    String username,
    Boolean isAdmin,
    Boolean isClient,
    String role,
    String profilePictureUrl,
    String ipAddress,
    Set<CustomPermission> customPermissions
) {}
