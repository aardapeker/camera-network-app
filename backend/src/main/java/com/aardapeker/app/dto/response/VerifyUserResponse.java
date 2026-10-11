package com.aardapeker.app.dto.response;

public record VerifyUserResponse(
    String token,
    String message,
    String username,
    String email
) {}
