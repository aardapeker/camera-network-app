package com.aardapeker.app.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

public record AdminLoginAttemptResponse(
    UUID id,
    String identifier,
    boolean successful,
    String ipAddress,
    String deviceType,
    String deviceModel,
    String browser,
    String os,
    String location,
    LocalDateTime attemptedAt,
    String failureReason
) {}
