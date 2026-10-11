package com.aardapeker.app.dto.request;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;

public record UserStatsRequest(@NotNull UUID userId, Integer days) {
  public UserStatsRequest {
    days = (days == null || days < 0) ? 30 : days;
  }
}
