package com.aardapeker.app.dto.response;

public record WelcomeResponse(
    String message,
    int recentNotesCount
) {
    public static WelcomeResponse simple(String message) {
        return new WelcomeResponse(message, 0);
    }

    public static WelcomeResponse of(String message, int recentNotesCount) {
        return new WelcomeResponse(message, recentNotesCount);
    }
}
