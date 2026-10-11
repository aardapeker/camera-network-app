package com.aardapeker.app.dto.response;

public record LoginStatisticsResponse(long totalAttempts, long successfulAttempts, long failedAttempts,
        double successRate) {

}
