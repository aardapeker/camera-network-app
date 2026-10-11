// DELETE LATER
package com.aardapeker.app.exception;

/**
 * Exception thrown when the authentication principal is not of the expected
 * type
 */
public class InvalidPrincipalTypeException extends RuntimeException {

    private final String actualType;

    public InvalidPrincipalTypeException(String actualType) {
        super("Invalid authentication principal type");
        this.actualType = actualType;
    }

    public String getActualType() {
        return actualType;
    }
}
