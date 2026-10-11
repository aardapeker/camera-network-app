package com.aardapeker.app.exception;

import com.aardapeker.app.dto.response.ApiErrorResponse;
import java.util.HashMap;
import java.util.Map;
import java.util.NoSuchElementException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    private ResponseEntity<ApiErrorResponse> buildError(
        HttpStatus status,
        String message,
        Map<String, String> details
    ) {
        return ResponseEntity.status(status).body(
            ApiErrorResponse.of(message, details, status)
        );
    }

    // 400 - Validation errors (@Valid)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidation(
        MethodArgumentNotValidException ex
    ) {
        Map<String, String> errors = new HashMap<>();
        ex
            .getBindingResult()
            .getFieldErrors()
            .forEach(err ->
                errors.put(err.getField(), err.getDefaultMessage())
            );

        return buildError(HttpStatus.BAD_REQUEST, "Validation failed", errors);
    }

    // 400 - Malformed JSON
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiErrorResponse> handleUnreadable(
        HttpMessageNotReadableException ex
    ) {
        if (
            ex.getCause() instanceof
                com.fasterxml.jackson.core.JsonParseException
        ) {
            return buildError(
                HttpStatus.BAD_REQUEST,
                "Invalid JSON format",
                null
            );
        }

        return buildError(
            HttpStatus.BAD_REQUEST,
            "Request body is missing or malformed",
            null
        );
    }

    // 404 - NoSuchElementException
    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<ApiErrorResponse> handleNoSuchElement(
        NoSuchElementException ex
    ) {
        String msg = (ex.getMessage() == null ||
                ex.getMessage().equals("No value present"))
            ? "Resource not found"
            : ex.getMessage();

        return buildError(HttpStatus.NOT_FOUND, msg, null);
    }

    // 400 - IllegalArgumentException
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiErrorResponse> handleIllegalArgument(
        IllegalArgumentException ex
    ) {
        return buildError(HttpStatus.BAD_REQUEST, ex.getMessage(), null);
    }

    // 401 - Custom Authentication errors
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiErrorResponse> handleAuth(
        AuthenticationException ex
    ) {
        return buildError(HttpStatus.UNAUTHORIZED, ex.getMessage(), null);
    }

    // 401 - Spring Security Authentication errors
    @ExceptionHandler(org.springframework.security.core.AuthenticationException.class)
    public ResponseEntity<ApiErrorResponse> handleSpringAuth(
        org.springframework.security.core.AuthenticationException ex
    ) {
        String message = ex.getMessage();

        // Provide user-friendly messages
        if (message != null && message.toLowerCase().contains("bad credentials")) {
            message = "Invalid email or password";
        } else if (message != null && message.toLowerCase().contains("disabled")) {
            message = "Account is disabled. Please verify your email";
        } else if (message != null && message.toLowerCase().contains("locked")) {
            message = "Account is locked";
        } else {
            message = "Invalid credentials";
        }

        return buildError(HttpStatus.UNAUTHORIZED, message, null);
    }

    // 403 - Forbidden
    @ExceptionHandler(UserNotEnabledException.class)
    public ResponseEntity<ApiErrorResponse> handleUserNotEnabled(
        UserNotEnabledException ex
    ) {
        return buildError(HttpStatus.FORBIDDEN, ex.getMessage(), null);
    }

    // 403 - Forbidden
    @ExceptionHandler(ForbiddenActionException.class)
    public ResponseEntity<ApiErrorResponse> handleForbiddenAction(
        ForbiddenActionException ex
    ) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
            ApiErrorResponse.of(ex.getMessage(), null, HttpStatus.FORBIDDEN)
        );
    }

    // LATER DELETE THIS EXCEPTION AND LET RESOURCE NOT FOUND HANDLE IT
    // 404 - User not found
    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleUserNotFound(
        UserNotFoundException ex
    ) {
        return buildError(HttpStatus.NOT_FOUND, ex.getMessage(), null);
    }

    // 400
    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ApiErrorResponse> handleBadRequest(
        BadRequestException ex
    ) {
        return buildError(HttpStatus.BAD_REQUEST, ex.getMessage(), null);
    }

    // 404
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleResourceNotFound(
        ResourceNotFoundException ex
    ) {
        return buildError(HttpStatus.NOT_FOUND, ex.getMessage(), null);
    }

    // 429 - Too many login attempts
    @ExceptionHandler(TooManyLoginAttemptsException.class)
    public ResponseEntity<ApiErrorResponse> handleTooManyLoginAttempts(
        TooManyLoginAttemptsException ex
    ) {
        return buildError(HttpStatus.TOO_MANY_REQUESTS, ex.getMessage(), null);
    }

    // 500 - Principal Type errors
    @ExceptionHandler(InvalidPrincipalTypeException.class)
    public ResponseEntity<ApiErrorResponse> handleInvalidPrincipal(
        InvalidPrincipalTypeException ex
    ) {
        return buildError(
            HttpStatus.INTERNAL_SERVER_ERROR,
            ex.getMessage(),
            Map.of("actualType", ex.getActualType())
        );
    }

    // 500 - Email sending failure
    @ExceptionHandler(EmailSendException.class)
    public ResponseEntity<ApiErrorResponse> handleEmailSend(
        EmailSendException ex
    ) {
        return buildError(
            HttpStatus.INTERNAL_SERVER_ERROR,
            ex.getMessage(),
            null
        );
    }

    // 500 - File storage errors
    @ExceptionHandler(FileStorageException.class)
    public ResponseEntity<ApiErrorResponse> handleFileStorage(
        FileStorageException ex
    ) {
        return buildError(
            HttpStatus.INTERNAL_SERVER_ERROR,
            ex.getMessage(),
            null
        );
    }

    // 500 - Fallback
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleGenericException(
        Exception ex
    ) {
        log.error("Unhandled exception occurred", ex);
        return buildError(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "An unexpected error occurred",
            null
        );
    }
}
