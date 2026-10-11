package com.aardapeker.app.service;

import com.aardapeker.app.dto.VerifyResult;
import com.aardapeker.app.dto.request.AuthRequest;
import com.aardapeker.app.dto.request.RegisterUserRequest;
import com.aardapeker.app.dto.request.ResetPasswordRequest;
import com.aardapeker.app.dto.request.VerifyUserRequest;
import com.aardapeker.app.dto.response.AuthResponse;
import com.aardapeker.app.model.User;
import jakarta.servlet.http.HttpServletRequest;

public interface AuthService {

    User findByIdentifier(String identifier);

    User createUser(RegisterUserRequest request);

    User verifyUser(VerifyUserRequest input);

    VerifyResult verifyUserAndGenerateToken(VerifyUserRequest input, HttpServletRequest request);

    void resendVerificationCode(String email);

    void sendVerificationEmail(User user, String rawCode);

    void sendResetPasswordLink(String email);

    void resetPassword(ResetPasswordRequest request);

    String generateResetPasswordToken();

    AuthResponse login(AuthRequest request, HttpServletRequest httpRequest);
}
