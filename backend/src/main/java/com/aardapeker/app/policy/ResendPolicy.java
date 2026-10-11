package com.aardapeker.app.policy;

import com.aardapeker.app.exception.ForbiddenActionException;
import com.aardapeker.app.model.User;
import com.aardapeker.app.repository.VerificationTokenRepository;
import java.time.LocalDateTime;
import org.springframework.stereotype.Component;

@Component
public class ResendPolicy {

    private final VerificationTokenRepository verificationTokenRepository;

    public ResendPolicy(
        VerificationTokenRepository verificationTokenRepository
    ) {
        this.verificationTokenRepository = verificationTokenRepository;
    }

    public void validateUserCanResendVerification(User user) {
        if (user.isEnabled()) {
            throw new ForbiddenActionException("User already verified");
        }

        if (!user.isAccountNonLocked()) {
            throw new ForbiddenActionException("User account locked");
        }

        int recentCount = verificationTokenRepository.countRecentTokens(
            user,
            LocalDateTime.now().minusMinutes(5)
        );

        if (recentCount >= 5) {
            throw new ForbiddenActionException(
                "Too many verification requests. Try again later."
            );
        }
    }
}
