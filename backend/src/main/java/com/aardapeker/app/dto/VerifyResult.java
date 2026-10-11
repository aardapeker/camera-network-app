package com.aardapeker.app.dto;

import com.aardapeker.app.model.User;

public record VerifyResult(User user, String token) {
    public static VerifyResult of(User user, String token) {
        return new VerifyResult(user, token);
    }
}
