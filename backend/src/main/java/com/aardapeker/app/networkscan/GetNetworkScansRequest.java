package com.aardapeker.app.networkscan;

import java.util.List;

public record GetNetworkScansRequest(
    String filterBy,
    String filterInput,
    List<String> sources,
    Integer page,
    Integer size,
    String sortBy,
    String sortDirection) {
  public GetNetworkScansRequest {
    // Compact constructor to set defaults
    if (page == null) {
      page = 0;
    }
    if (size == null) {
      size = 25;
    }
    if (sortBy == null) {
      sortBy = "scannedAt";
    }
    if (sortDirection == null) {
      sortDirection = "DESC";
    }
  }
}
