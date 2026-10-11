package com.aardapeker.app.dto.response;

import java.util.List;

public record UserRolesResponse(List<String> roles, String message) {

}
