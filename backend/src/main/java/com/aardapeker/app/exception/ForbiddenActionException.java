package com.aardapeker.app.exception;

public class ForbiddenActionException extends RuntimeException {
  public ForbiddenActionException(String message) {
    super(message);
  }
}
