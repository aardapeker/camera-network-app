package com.aardapeker.app.dto.request;

public record SuccessfulLoginAttemptsRequest(
    Integer page,
    Integer size) {
  public SuccessfulLoginAttemptsRequest {
    page = (page == null || page < 0) ? 0 : page;
    size = (size == null || size <= 0) ? 20 : size;
  }

}
