package com.aardapeker.app.dto.request;

import com.aardapeker.app.model.Role;
import jakarta.validation.constraints.NotNull;

public record UpdateUserRoleRequest(
    @NotNull(message = "Role is required") Role role
) {}
