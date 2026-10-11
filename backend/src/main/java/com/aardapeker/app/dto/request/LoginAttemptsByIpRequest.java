package com.aardapeker.app.dto.request;

import jakarta.validation.constraints.NotBlank;

public record LoginAttemptsByIpRequest(
    @NotBlank(message = "IP address is required") String ip,
    Integer page,
    Integer size) {
  public LoginAttemptsByIpRequest {
    page = (page == null || page < 0) ? 0 : page;
    size = (size == null || size <= 0) ? 20 : size;
  }

}