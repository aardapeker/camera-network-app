package com.aardapeker.app.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

public record UserLoginAttemptResponse(
    UUID id,
    boolean successful,
    String deviceType,
    String deviceModel,
    String browser,
    String os,
    String location,
    LocalDateTime attemptedAt
) {}
