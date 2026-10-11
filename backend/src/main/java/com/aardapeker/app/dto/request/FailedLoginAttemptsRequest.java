package com.aardapeker.app.dto.request;

public record FailedLoginAttemptsRequest(
    Integer page,
    Integer size) {
  public FailedLoginAttemptsRequest {
    page = (page == null || page < 0) ? 0 : page;
    size = (size == null || size <= 0) ? 20 : size;
  }
}
