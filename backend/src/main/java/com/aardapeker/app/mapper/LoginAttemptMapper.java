package com.aardapeker.app.mapper;

import com.aardapeker.app.dto.response.AdminLoginAttemptResponse;
import com.aardapeker.app.dto.response.UserLoginAttemptResponse;
import com.aardapeker.app.model.LoginAttempt;

public final class LoginAttemptMapper {

    private LoginAttemptMapper() {}

    public static AdminLoginAttemptResponse toAdminResponse(LoginAttempt attempt) {
        return new AdminLoginAttemptResponse(
            attempt.getId(),
            attempt.getIdentifier(),
            attempt.isSuccessful(),
            attempt.getIpAddress(),
            attempt.getDeviceType(),
            attempt.getDeviceModel(),
            attempt.getBrowser(),
            attempt.getOs(),
            attempt.getLocation(),
            attempt.getAttemptedAt(),
            attempt.getFailureReason()
        );
    }

    public static UserLoginAttemptResponse toUserResponse(LoginAttempt attempt) {
        return new UserLoginAttemptResponse(
            attempt.getId(),
            attempt.isSuccessful(),
            attempt.getDeviceType(),
            attempt.getDeviceModel(),
            attempt.getBrowser(),
            attempt.getOs(),
            attempt.getLocation(),
            attempt.getAttemptedAt()
        );
    }
}
