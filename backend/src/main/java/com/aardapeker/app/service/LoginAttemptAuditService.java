package com.aardapeker.app.service;

import com.aardapeker.app.model.LoginAttempt;
import jakarta.servlet.http.HttpServletRequest;

public interface LoginAttemptAuditService {

    long countRecentFailedAttempts(String identifier, int minutes);

    boolean isUnderBruteForceAttack(String identifier, int maxAttempts, int minutes);

    LoginAttempt logLoginAttempt(
        String identifier,
        boolean successful,
        String failureReason,
        HttpServletRequest request
    );

    LoginAttempt logSuccessfulLogin(String identifier, HttpServletRequest request);

    LoginAttempt logFailedLogin(
        String identifier,
        String failureReason,
        HttpServletRequest request
    );
}
