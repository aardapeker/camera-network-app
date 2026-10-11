package com.aardapeker.app.service.impl;

import com.aardapeker.app.dto.response.AdminLoginAttemptResponse;
import com.aardapeker.app.dto.request.LoginAttemptsRequest;
import com.aardapeker.app.dto.response.LoginStatisticsResponse;
import com.aardapeker.app.dto.response.PageResponse;
import com.aardapeker.app.dto.request.SearchLoginAttemptsRequest;
import com.aardapeker.app.model.LoginAttempt;
import com.aardapeker.app.repository.LoginAttemptRepository;
import com.aardapeker.app.service.LoginAttemptAdminService;
import com.aardapeker.app.mapper.LoginAttemptMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

@Service
public class LoginAttemptAdminServiceImpl implements LoginAttemptAdminService {

    private final LoginAttemptRepository loginAttemptRepository;

    public LoginAttemptAdminServiceImpl(
        LoginAttemptRepository loginAttemptRepository
    ) {
        this.loginAttemptRepository = loginAttemptRepository;
    }

    @Override
    public PageResponse<AdminLoginAttemptResponse> getLoginAttempts(
        LoginAttemptsRequest request
    ) {
        Pageable pageable = PageRequest.of(
            request.page(),
            request.size(),
            Sort.by(request.sortDirection(), request.sortBy())
        );

        Page<LoginAttempt> results = loginAttemptRepository.findAll(pageable);

        return PageResponse.of(
            results.map(LoginAttemptMapper::toAdminResponse)
        );
    }

    @Override
    public PageResponse<AdminLoginAttemptResponse> loginAttemptsByIdentifier(
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

        return PageResponse.of(
            results.map(LoginAttemptMapper::toAdminResponse)
        );
    }

    @Override
    public PageResponse<AdminLoginAttemptResponse> failedAttempts(
        Pageable pageable
    ) {
        Page<LoginAttempt> results =
            loginAttemptRepository.findBySuccessfulOrderByAttemptedAtDesc(
                false,
                pageable
            );
        return PageResponse.of(
            results.map(LoginAttemptMapper::toAdminResponse)
        );
    }

    @Override
    public PageResponse<AdminLoginAttemptResponse> successfulAttempts(
        Pageable pageable
    ) {
        Page<LoginAttempt> results =
            loginAttemptRepository.findBySuccessfulOrderByAttemptedAtDesc(
                true,
                pageable
            );
        return PageResponse.of(
            results.map(LoginAttemptMapper::toAdminResponse)
        );
    }

    @Override
    public PageResponse<AdminLoginAttemptResponse> loginAttemptsByIpAddress(
        String ipAddress,
        Pageable pageable
    ) {
        Page<LoginAttempt> results =
            loginAttemptRepository.findByIpAddressOrderByAttemptedAtDesc(
                ipAddress,
                pageable
            );

        return PageResponse.of(
            results.map(LoginAttemptMapper::toAdminResponse)
        );
    }

    @Override
    public LoginStatisticsResponse loginStatistics() {
        long totalAttempts = loginAttemptRepository.count();
        long successfulAttempts = loginAttemptRepository.countBySuccessful(
            true
        );
        long failedAttempts = totalAttempts - successfulAttempts;

        double successRate = totalAttempts == 0
            ? 0
            : (successfulAttempts * 100.0) / totalAttempts;

        LoginStatisticsResponse response = new LoginStatisticsResponse(
            totalAttempts,
            successfulAttempts,
            failedAttempts,
            successRate
        );

        return response;
    }
}
