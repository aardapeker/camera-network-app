package com.aardapeker.app.dto.response;

public record CurrentUserResponse(String firstName, String lastName, String username, String email,
        String profilePictureUrl, Boolean isAdmin) {

}
