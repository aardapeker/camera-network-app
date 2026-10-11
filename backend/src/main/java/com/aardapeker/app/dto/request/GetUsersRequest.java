package com.aardapeker.app.dto.request;

import java.util.List;

public record GetUsersRequest(
    String filterBy,
    String filterInput,
    List<String> roles,
    List<String> statuses,
    Integer page,
    Integer size,
    String sortBy,
    String sortDirection) {
  public GetUsersRequest {
    // Compact constructor to set defaults
    if (page == null) {
      page = 0;
    }
    if (size == null) {
      size = 10;
    }
    if (sortBy == null) {
      sortBy = "username";
    }
    if (sortDirection == null) {
      sortDirection = "ASC";
    }
  }
}