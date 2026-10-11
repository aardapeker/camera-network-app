package com.aardapeker.app.dto;

import java.util.Map;
import org.springframework.http.HttpStatus;

public class AuthenticationResult {

    private final boolean success;
    private final String token;
    private final String username;
    private final String email;
    private final String errorCode;
    private final String errorMessage;
    private final HttpStatus httpStatus;

    private AuthenticationResult(
        boolean success,
        String token,
        String username,
        String email,
        String errorCode,
        String errorMessage,
        HttpStatus httpStatus
    ) {
        this.success = success;
        this.token = token;
        this.username = username;
        this.email = email;
        this.errorCode = errorCode;
        this.errorMessage = errorMessage;
        this.httpStatus = httpStatus;
    }

    // Static factory method for success
    public static AuthenticationResult success(
        String token,
        String username,
        String email
    ) {
        return new AuthenticationResult(
            true,
            token,
            username,
            email,
            null,
            null,
            HttpStatus.OK
        );
    }

    // Static factory method for failure
    public static AuthenticationResult failure(
        String errorCode,
        String errorMessage
    ) {
        HttpStatus status = determineHttpStatus(errorCode);
        return new AuthenticationResult(
            false,
            null,
            null,
            null,
            errorCode,
            errorMessage,
            status
        );
    }

    // Determine HTTP status from error code
    private static HttpStatus determineHttpStatus(String errorCode) {
        return switch (errorCode) {
            case "TOO_MANY_ATTEMPTS" -> HttpStatus.TOO_MANY_REQUESTS;
            case "INVALID_INPUT" -> HttpStatus.BAD_REQUEST;
            case "SYSTEM_ERROR" -> HttpStatus.INTERNAL_SERVER_ERROR;
            default -> HttpStatus.UNAUTHORIZED;
        };
    }

    // Build response body for success
    public Map<String, Object> toSuccessResponse() {
        return Map.of(
            "token",
            token,
            "message",
            "Authentication successful",
            "username",
            username,
            "email",
            email
        );
    }

    // Build response body for failure
    public Map<String, Object> toErrorResponse() {
        return Map.of("error", errorMessage);
    }

    // Build response body (success or failure)
    public Map<String, Object> toResponse() {
        return success ? toSuccessResponse() : toErrorResponse();
    }

    // Getters
    public boolean isSuccess() {
        return success;
    }

    public String getToken() {
        return token;
    }

    public String getUsername() {
        return username;
    }

    public String getEmail() {
        return email;
    }

    public String getErrorCode() {
        return errorCode;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public HttpStatus getHttpStatus() {
        return httpStatus;
    }
}
