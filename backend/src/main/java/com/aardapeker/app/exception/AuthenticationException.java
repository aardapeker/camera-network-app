package com.aardapeker.app.exception;

/**
 * Exception thrown when user authentication fails
 */
public class AuthenticationException extends RuntimeException {

    public AuthenticationException(String message) {
        super(message);
    }
}
