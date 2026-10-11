package com.aardapeker.app.service;

import com.aardapeker.app.dto.response.AdminLoginAttemptResponse;
import com.aardapeker.app.dto.request.LoginAttemptsRequest;
import com.aardapeker.app.dto.response.LoginStatisticsResponse;
import com.aardapeker.app.dto.response.PageResponse;
import com.aardapeker.app.dto.request.SearchLoginAttemptsRequest;
import org.springframework.data.domain.Pageable;

public interface LoginAttemptAdminService {

    PageResponse<AdminLoginAttemptResponse> getLoginAttempts(LoginAttemptsRequest request);

    PageResponse<AdminLoginAttemptResponse> loginAttemptsByIdentifier(SearchLoginAttemptsRequest request);

    PageResponse<AdminLoginAttemptResponse> failedAttempts(Pageable pageable);

    PageResponse<AdminLoginAttemptResponse> successfulAttempts(Pageable pageable);

    PageResponse<AdminLoginAttemptResponse> loginAttemptsByIpAddress(String ipAddress, Pageable pageable);

    LoginStatisticsResponse loginStatistics();
}
