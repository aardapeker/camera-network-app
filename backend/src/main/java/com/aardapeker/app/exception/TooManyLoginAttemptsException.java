package com.aardapeker.app.exception;

public class TooManyLoginAttemptsException extends RuntimeException {

    public TooManyLoginAttemptsException() {
        super("Too many failed login attempts. Please try again later.");
    }

    public TooManyLoginAttemptsException(String message) {
        super(message);
    }
}
