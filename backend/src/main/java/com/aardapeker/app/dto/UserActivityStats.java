package com.aardapeker.app.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record UserActivityStats(
                UUID userId,
                String username,
                String email,
                String firstName,
                String lastName,
                String profilePictureUrl,
                Long totalSessions,
                Long totalTimeSeconds,
                Double averageSessionDurationSeconds,
                LocalDateTime lastLoginTime,
                LocalDateTime lastActivityTime,
                Long activeSessions) {
        public static UserActivityStats empty(UUID userId) {
                return new UserActivityStats(
                                userId,
                                null,
                                null,
                                null,
                                null,
                                null,
                                0L,
                                0L,
                                0.0,
                                null,
                                null,
                                0L);
        }
}
