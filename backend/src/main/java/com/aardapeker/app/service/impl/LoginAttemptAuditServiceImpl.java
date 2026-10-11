package com.aardapeker.app.service.impl;

import com.aardapeker.app.model.LoginAttempt;
import com.aardapeker.app.model.User;
import com.aardapeker.app.repository.LoginAttemptRepository;
import com.aardapeker.app.repository.UserRepository;
import com.aardapeker.app.service.GeolocationService;
import com.aardapeker.app.service.LoginAttemptAuditService;
import com.aardapeker.app.util.HttpRequestHelper;
import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class LoginAttemptAuditServiceImpl implements LoginAttemptAuditService {

    private final UserRepository userRepository;
    private final GeolocationService geolocationService;
    private final LoginAttemptRepository loginAttemptRepository;

    public LoginAttemptAuditServiceImpl(
        UserRepository userRepository,
        GeolocationService geolocationService,
        LoginAttemptRepository loginAttemptRepository
    ) {
        this.userRepository = userRepository;
        this.geolocationService = geolocationService;
        this.loginAttemptRepository = loginAttemptRepository;
    }

    @Override
    public long countRecentFailedAttempts(String identifier, int minutes) {
        LocalDateTime since = LocalDateTime.now().minusMinutes(minutes);
        return loginAttemptRepository.countFailedAttemptsByIdentifierSince(
            identifier,
            since
        );
    }

    @Override
    public boolean isUnderBruteForceAttack(
        String identifier,
        int maxAttempts,
        int minutes
    ) {
        long failedAttempts = countRecentFailedAttempts(identifier, minutes);
        return failedAttempts >= maxAttempts;
    }

    @Override
    public LoginAttempt logLoginAttempt(
        String identifier,
        boolean successful,
        String failureReason,
        HttpServletRequest request
    ) {
        String ipAddress = HttpRequestHelper.getClientIpAddress(request);
        String userAgent = HttpRequestHelper.getUserAgent(request);
        String deviceType = HttpRequestHelper.getDeviceType(userAgent);
        String deviceModel = HttpRequestHelper.getDeviceModel(userAgent);
        String browser = HttpRequestHelper.getBrowser(userAgent);
        String os = HttpRequestHelper.getOperatingSystem(userAgent);
        String location = geolocationService.getFormattedLocation(ipAddress);

        Optional<User> userOptional = userRepository
            .findByUsername(identifier)
            .or(() -> userRepository.findByEmail(identifier));

        LoginAttempt attempt = LoginAttempt.builder()
            .user(userOptional.orElse(null))
            .identifier(identifier)
            .successful(successful)
            .ipAddress(ipAddress)
            .userAgent(userAgent)
            .deviceType(deviceType)
            .deviceModel(deviceModel)
            .browser(browser)
            .os(os)
            .location(location)
            .attemptedAt(LocalDateTime.now())
            .failureReason(failureReason)
            .build();

        return loginAttemptRepository.save(attempt);
    }

    @Override
    public LoginAttempt logSuccessfulLogin(
        String identifier,
        HttpServletRequest request
    ) {
        return logLoginAttempt(identifier, true, null, request);
    }

    @Override
    public LoginAttempt logFailedLogin(
        String identifier,
        String failureReason,
        HttpServletRequest request
    ) {
        return logLoginAttempt(identifier, false, failureReason, request);
    }
}
