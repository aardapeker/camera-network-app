package com.aardapeker.app.service;

import com.aardapeker.app.dto.response.AdminLoginAttemptResponse;
import com.aardapeker.app.dto.request.FailedLoginAttemptsRequest;
import com.aardapeker.app.dto.request.LoginAttemptsByIpRequest;
import com.aardapeker.app.dto.request.LoginAttemptsRequest;
import com.aardapeker.app.dto.response.LoginStatisticsResponse;
import com.aardapeker.app.dto.response.PageResponse;
import com.aardapeker.app.dto.request.SearchLoginAttemptsRequest;
import com.aardapeker.app.dto.request.SuccessfulLoginAttemptsRequest;
import com.aardapeker.app.model.LoginAttempt;
import com.aardapeker.app.model.User;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface LoginAttemptService {

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

    List<LoginAttempt> getRecentAttempts(User user, int days);

    long countRecentFailedAttempts(String identifier, int minutes);

    boolean isUnderBruteForceAttack(String identifier, int maxAttempts, int minutes);

    Page<LoginAttempt> getAllLoginAttempts(Pageable pageable);

    Page<LoginAttempt> searchByIdentifier(String identifier, Pageable pageable);

    Page<LoginAttempt> getFailedAttempts(Pageable pageable);

    Page<LoginAttempt> getSuccessfulAttempts(Pageable pageable);

    Page<LoginAttempt> searchByIpAddress(String ipAddress, Pageable pageable);

    PageResponse<AdminLoginAttemptResponse> getLoginAttempts(LoginAttemptsRequest request);

    PageResponse<AdminLoginAttemptResponse> searchLoginAttempts(SearchLoginAttemptsRequest request);

    PageResponse<AdminLoginAttemptResponse> failedLoginAttempts(FailedLoginAttemptsRequest request);

    PageResponse<AdminLoginAttemptResponse> successfulLoginAttempts(SuccessfulLoginAttemptsRequest request);

    PageResponse<AdminLoginAttemptResponse> loginAttemptsByIpAddress(LoginAttemptsByIpRequest request);

    LoginStatisticsResponse loginStatistics();
}
