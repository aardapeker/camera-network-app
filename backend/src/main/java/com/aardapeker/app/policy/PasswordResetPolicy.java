package com.aardapeker.app.policy;

import com.aardapeker.app.exception.BadRequestException;
import com.aardapeker.app.model.PasswordResetToken;
import java.time.LocalDateTime;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class PasswordResetPolicy {

    public void validateToken(PasswordResetToken token) {
        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Reset token expired");
        }

        if (token.isUsed()) {
            throw new BadRequestException("Reset token already used");
        }
    }

    public void validateTokenMatches(
        String rawToken,
        String hashedToken,
        PasswordEncoder encoder
    ) {
        if (!encoder.matches(rawToken, hashedToken)) {
            throw new BadRequestException("Invalid reset token");
        }
    }
}
