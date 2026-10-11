package com.aardapeker.app.exception;

public class UserNotEnabledException extends RuntimeException {
  public UserNotEnabledException(String message) {
    super(message);
  }
}
