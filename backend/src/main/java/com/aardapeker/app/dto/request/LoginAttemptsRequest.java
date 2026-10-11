package com.aardapeker.app.dto.request;

import org.springframework.data.domain.Sort;

public record LoginAttemptsRequest(
    Integer page,
    Integer size,
    String sortBy,
    Sort.Direction sortDirection) {
  public LoginAttemptsRequest {
    page = (page == null || page < 0) ? 0 : page;
    size = (size == null || size <= 0) ? 20 : size;
    sortBy = (sortBy == null || sortBy.isBlank())
        ? "attemptedAt"
        : sortBy;
    sortDirection = (sortDirection == null)
        ? Sort.Direction.DESC
        : sortDirection;
  }
}
