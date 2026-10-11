package com.aardapeker.app.service.impl;

import com.aardapeker.app.dto.request.FailedLoginAttemptsRequest;
import com.aardapeker.app.dto.request.LoginAttemptsByIpRequest;
import com.aardapeker.app.dto.request.LoginAttemptsRequest;
import com.aardapeker.app.dto.request.SearchLoginAttemptsRequest;
import com.aardapeker.app.dto.request.SuccessfulLoginAttemptsRequest;
import com.aardapeker.app.dto.response.AdminLoginAttemptResponse;
import com.aardapeker.app.dto.response.LoginStatisticsResponse;
import com.aardapeker.app.dto.response.PageResponse;
import com.aardapeker.app.model.LoginAttempt;
import com.aardapeker.app.model.User;
import com.aardapeker.app.repository.LoginAttemptRepository;
import com.aardapeker.app.repository.UserRepository;
import com.aardapeker.app.service.GeolocationService;
import com.aardapeker.app.service.LoginAttemptService;
import com.aardapeker.app.util.HttpRequestHelper;
import com.aardapeker.app.mapper.LoginAttemptMapper;
import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LoginAttemptServiceImpl implements LoginAttemptService {

    private final UserRepository userRepository;
    private final GeolocationService geolocationService;
    private final LoginAttemptRepository loginAttemptRepository;

    public LoginAttemptServiceImpl(
        UserRepository userRepository,
        GeolocationService geolocationService,
        LoginAttemptRepository loginAttemptRepository
    ) {
        this.userRepository = userRepository;
        this.geolocationService = geolocationService;
        this.loginAttemptRepository = loginAttemptRepository;
    }

    private String normalizeIdentifier(String identifier) {
        return identifier == null ? null : identifier.trim().toLowerCase();
    }

    @Override
    @Transactional
    public LoginAttempt logLoginAttempt(
        String identifier,
        boolean successful,
        String failureReason,
        HttpServletRequest request
    ) {
        String normalizedIdentifier = normalizeIdentifier(identifier);

        String ipAddress = HttpRequestHelper.getClientIpAddress(request);
        String userAgent = HttpRequestHelper.getUserAgent(request);
        String deviceType = HttpRequestHelper.getDeviceType(userAgent);
        String deviceModel = HttpRequestHelper.getDeviceModel(userAgent);
        String browser = HttpRequestHelper.getBrowser(userAgent);
        String os = HttpRequestHelper.getOperatingSystem(userAgent);
        String location = geolocationService.getFormattedLocation(ipAddress);

        Optional<User> userOptional = userRepository
            .findByUsername(normalizedIdentifier)
            .or(() -> userRepository.findByEmail(normalizedIdentifier));

        LoginAttempt attempt = LoginAttempt.builder()
            .user(userOptional.orElse(null))
            .identifier(normalizedIdentifier)
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
    @Transactional
    public LoginAttempt logSuccessfulLogin(String identifier, HttpServletRequest request) {
        String normalizedIdentifier = normalizeIdentifier(identifier);
        return logLoginAttempt(normalizedIdentifier, true, null, request);
    }

    @Override
    @Transactional
    public LoginAttempt logFailedLogin(
        String identifier,
        String failureReason,
        HttpServletRequest request
    ) {
        String normalizedIdentifier = normalizeIdentifier(identifier);
        return logLoginAttempt(normalizedIdentifier, false, failureReason, request);
    }

    @Override
    @Transactional(readOnly = true)
    public List<LoginAttempt> getRecentAttempts(User user, int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        return loginAttemptRepository.findRecentAttemptsByUser(user, since);
    }

    @Override
    @Transactional(readOnly = true)
    public long countRecentFailedAttempts(String identifier, int minutes) {
        String normalizedIdentifier = normalizeIdentifier(identifier);
        LocalDateTime since = LocalDateTime.now().minusMinutes(minutes);
        return loginAttemptRepository.countFailedAttemptsByIdentifierSince(
            normalizedIdentifier,
            since
        );
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isUnderBruteForceAttack(String identifier, int maxAttempts, int minutes) {
        String normalizedIdentifier = normalizeIdentifier(identifier);
        long failedAttempts = countRecentFailedAttempts(normalizedIdentifier, minutes);
        return failedAttempts >= maxAttempts;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<LoginAttempt> getAllLoginAttempts(Pageable pageable) {
        return loginAttemptRepository.findAllByOrderByAttemptedAtDesc(pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<LoginAttempt> searchByIdentifier(String identifier, Pageable pageable) {
        String normalizedIdentifier = normalizeIdentifier(identifier);
        return loginAttemptRepository.findByIdentifierContainingOrderByAttemptedAtDesc(
            normalizedIdentifier,
            pageable
        );
    }

    @Override
    @Transactional(readOnly = true)
    public Page<LoginAttempt> getFailedAttempts(Pageable pageable) {
        return loginAttemptRepository.findBySuccessfulOrderByAttemptedAtDesc(false, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<LoginAttempt> getSuccessfulAttempts(Pageable pageable) {
        return loginAttemptRepository.findBySuccessfulOrderByAttemptedAtDesc(true, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<LoginAttempt> searchByIpAddress(String ipAddress, Pageable pageable) {
        return loginAttemptRepository.findByIpAddressOrderByAttemptedAtDesc(ipAddress, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AdminLoginAttemptResponse> getLoginAttempts(LoginAttemptsRequest request) {
        Pageable pageable = PageRequest.of(
            request.page(),
            request.size(),
            Sort.by(request.sortDirection(), request.sortBy())
        );

        Page<LoginAttempt> results = loginAttemptRepository.findAll(pageable);

        return PageResponse.of(results.map(LoginAttemptMapper::toAdminResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AdminLoginAttemptResponse> searchLoginAttempts(
        SearchLoginAttemptsRequest request
    ) {
        Pageable pageable = PageRequest.of(
            request.page(),
            request.size(),
            Sort.by(Sort.Direction.DESC, "attemptedAt")
        );

        Page<LoginAttempt> results =
            loginAttemptRepository.findByIdentifierContainingOrderByAttemptedAtDesc(
                request.identifier(),
                pageable
            );

        return PageResponse.of(results.map(LoginAttemptMapper::toAdminResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AdminLoginAttemptResponse> failedLoginAttempts(
        FailedLoginAttemptsRequest request
    ) {
        Pageable pageable = PageRequest.of(
            request.page(),
            request.size(),
            Sort.by(Sort.Direction.DESC, "attemptedAt")
        );

        Page<LoginAttempt> results = getFailedAttempts(pageable);

        return PageResponse.of(results.map(LoginAttemptMapper::toAdminResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AdminLoginAttemptResponse> successfulLoginAttempts(
        SuccessfulLoginAttemptsRequest request
    ) {
        Pageable pageable = PageRequest.of(
            request.page(),
            request.size(),
            Sort.by(Sort.Direction.DESC, "attemptedAt")
        );

        Page<LoginAttempt> results = getSuccessfulAttempts(pageable);

        return PageResponse.of(results.map(LoginAttemptMapper::toAdminResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AdminLoginAttemptResponse> loginAttemptsByIpAddress(
        LoginAttemptsByIpRequest request
    ) {
        Pageable pageable = PageRequest.of(
            request.page(),
            request.size(),
            Sort.by(Sort.Direction.DESC, "attemptedAt")
        );

        Page<LoginAttempt> results = searchByIpAddress(request.ip(), pageable);

        return PageResponse.of(results.map(LoginAttemptMapper::toAdminResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public LoginStatisticsResponse loginStatistics() {
        long totalAttempts = loginAttemptRepository.count();
        long successfulAttempts = loginAttemptRepository.countBySuccessful(true);
        long failedAttempts = totalAttempts - successfulAttempts;

        double successRate = totalAttempts == 0
            ? 0
            : (successfulAttempts * 100.0) / totalAttempts;

        return new LoginStatisticsResponse(
            totalAttempts,
            successfulAttempts,
            failedAttempts,
            successRate
        );
    }
}
