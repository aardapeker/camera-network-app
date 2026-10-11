package com.aardapeker.app.dto.response;

public record UserDetailsResponse(
    String remoteAddress,
    String sessionId) {
}
