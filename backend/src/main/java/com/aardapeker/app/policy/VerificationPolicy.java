package com.aardapeker.app.policy;

import com.aardapeker.app.exception.BadRequestException;
import com.aardapeker.app.model.VerificationToken;
import com.aardapeker.app.repository.VerificationTokenRepository;
import java.time.LocalDateTime;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class VerificationPolicy {

    private static final int MAX_ATTEMPTS = 5;
    private final VerificationTokenRepository verificationTokenRepository;

    public VerificationPolicy(
        VerificationTokenRepository verificationTokenRepository
    ) {
        this.verificationTokenRepository = verificationTokenRepository;
    }

    public void validateCode(
        VerificationToken token,
        String rawCode,
        PasswordEncoder encoder
    ) {
        if (token.isUsed()) {
            throw new BadRequestException("Verification token already used");
        }

        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Verification token expired");
        }

        if (!encoder.matches(rawCode, token.getHashedCode())) {
            verificationTokenRepository.incrementAttempts(token.getId());
            verificationTokenRepository.lockIfMaxAttemptsReached(
                token.getId(),
                MAX_ATTEMPTS
            );

            int updatedAttempts = token.getAttempts() + 1;

            throw new BadRequestException(
                updatedAttempts >= MAX_ATTEMPTS
                    ? "Too many attempts. Verification code locked."
                    : "Invalid verification code"
            );
        }
    }
}
