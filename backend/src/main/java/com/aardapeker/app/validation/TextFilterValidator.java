package com.aardapeker.app.validation;

import org.springframework.stereotype.Component;

import com.aardapeker.app.dto.request.GetUsersRequest;

@Component
public class TextFilterValidator {
  public void validateTextFilter(GetUsersRequest request) {
    if (request.filterBy() != null &&
        (request.filterInput() == null || request.filterInput().isBlank())) {
      throw new IllegalArgumentException(
          "filterInput is required when filterBy is provided");
    }
  }
}
