package com.aardapeker.app.validation;

import com.aardapeker.app.dto.request.AuthRequest;
import com.aardapeker.app.exception.BadRequestException;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;

@Component
public class AuthValidator {

    private static final Pattern EMAIL_PATTERN =
        Pattern.compile("^[A-Za-z0-9+_.-]+@(.+)$");
    private static final int MIN_PASSWORD_LENGTH = 6;
    private static final int VERIFICATION_CODE_LENGTH = 6;

    public void validateLoginRequest(AuthRequest request) {
        if (request.identifier() == null || request.identifier().isBlank()) {
            throw new BadRequestException("Username or email is required");
        }
        if (request.password() == null || request.password().isBlank()) {
            throw new BadRequestException("Password is required");
        }
    }

    public void validateEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new BadRequestException("Email is required");
        }
        if (!EMAIL_PATTERN.matcher(email).matches()) {
            throw new BadRequestException("Valid email is required");
        }
    }

    public void validateVerificationCode(String code) {
        if (code == null || code.isBlank()) {
            throw new BadRequestException("Verification code is required");
        }
        if (code.length() != VERIFICATION_CODE_LENGTH || !code.matches("\\d{6}")) {
            throw new BadRequestException("Invalid verification code format. Must be 6 digits");
        }
    }

    public void validatePassword(String password) {
        if (password == null || password.isBlank()) {
            throw new BadRequestException("Password is required");
        }
        if (password.length() < MIN_PASSWORD_LENGTH) {
            throw new BadRequestException(
                "Password must be at least " + MIN_PASSWORD_LENGTH + " characters"
            );
        }
    }

    public void validateResetToken(String token) {
        if (token == null || token.isBlank()) {
            throw new BadRequestException("Reset token is required");
        }
    }
}
