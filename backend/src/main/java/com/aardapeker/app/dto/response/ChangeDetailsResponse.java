package com.aardapeker.app.dto.response;

import java.util.UUID;

public record ChangeDetailsResponse(
    UUID id,
    String username,
    String firstName,
    String lastName,
    String email,
    String message) {

}
