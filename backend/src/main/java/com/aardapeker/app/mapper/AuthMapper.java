package com.aardapeker.app.mapper;

import com.aardapeker.app.dto.response.ResendCodeResponse;
import com.aardapeker.app.dto.response.ResetPasswordLinkResponse;
import com.aardapeker.app.dto.response.RestrictedUserResponse;
import com.aardapeker.app.dto.response.SuccessResponse;
import com.aardapeker.app.dto.response.VerifyUserResponse;
import com.aardapeker.app.model.User;
import org.springframework.stereotype.Component;

@Component
public class AuthMapper {

    public RestrictedUserResponse toSignupResponse(User user) {
        return RestrictedUserResponse.from(
            user,
            "User registered successfully. Please check your email for verification code."
        );
    }

    public VerifyUserResponse toVerifyResponse(User user, String token) {
        return new VerifyUserResponse(
            token,
            "User verified successfully",
            user.getUsername(),
            user.getEmail()
        );
    }

    public ResetPasswordLinkResponse toResetLinkResponse(String email) {
        return new ResetPasswordLinkResponse(
            "If an account exists, a reset password link has been sent.",
            email
        );
    }

    public ResendCodeResponse toResendCodeResponse(String email) {
        return new ResendCodeResponse(
            "Verification code sent successfully",
            email
        );
    }

    public SuccessResponse toPasswordResetResponse() {
        return new SuccessResponse("Password has been changed successfully");
    }
}
