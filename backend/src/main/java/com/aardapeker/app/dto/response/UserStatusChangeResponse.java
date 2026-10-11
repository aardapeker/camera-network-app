package com.aardapeker.app.dto.response;

import com.aardapeker.app.model.Status;
import java.util.UUID;

public record UserStatusChangeResponse(
    String message,
    UUID userId,
    Status status
) {}
