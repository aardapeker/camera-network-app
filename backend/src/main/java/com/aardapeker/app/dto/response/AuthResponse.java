package com.aardapeker.app.dto.response;

public record AuthResponse(
    String token,
    String message,
    String username) {
}
