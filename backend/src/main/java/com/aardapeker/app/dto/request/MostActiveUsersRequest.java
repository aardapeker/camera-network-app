package com.aardapeker.app.dto.request;

public record MostActiveUsersRequest(
    Integer days,
    Integer page,
    Integer size) {
  public MostActiveUsersRequest {
    days = (days == null || days < 0) ? 30 : days;
    page = (page == null || page < 0) ? 0 : page;
    size = (size == null || size <= 0) ? 20 : size;
  }

}