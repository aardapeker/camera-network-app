package com.aardapeker.app.dto.response;

import java.time.LocalDateTime;
import java.util.Map;
import org.springframework.http.HttpStatus;

public record ApiErrorResponse(
    String message,
    Map<String, String> details,
    int status,
    LocalDateTime timestamp
) {
    public static ApiErrorResponse of(
        String message,
        Map<String, String> details,
        HttpStatus status
    ) {
        return new ApiErrorResponse(
            message,
            details,
            status.value(),
            LocalDateTime.now()
        );
    }
}
