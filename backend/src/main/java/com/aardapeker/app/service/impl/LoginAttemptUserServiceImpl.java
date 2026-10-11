package com.aardapeker.app.service.impl;

import com.aardapeker.app.dto.response.PageResponse;
import com.aardapeker.app.dto.response.UserLoginAttemptResponse;
import com.aardapeker.app.model.LoginAttempt;
import com.aardapeker.app.model.User;
import com.aardapeker.app.repository.LoginAttemptRepository;
import com.aardapeker.app.service.LoginAttemptUserService;
import com.aardapeker.app.mapper.LoginAttemptMapper;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class LoginAttemptUserServiceImpl implements LoginAttemptUserService {

    private final LoginAttemptRepository loginAttemptRepository;

    public LoginAttemptUserServiceImpl(
        LoginAttemptRepository loginAttemptRepository
    ) {
        this.loginAttemptRepository = loginAttemptRepository;
    }

    @Override
    public PageResponse<UserLoginAttemptResponse> loginAttempts(
        User user,
        Pageable pageable
    ) {
        Page<LoginAttempt> results =
            loginAttemptRepository.findByUserOrderByAttemptedAtDesc(
                user,
                pageable
            );

        return PageResponse.of(results.map(LoginAttemptMapper::toUserResponse));
    }

    @Override
    public List<UserLoginAttemptResponse> recentAttempts(User user, int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        List<LoginAttempt> results =
            loginAttemptRepository.findRecentAttemptsByUser(user, since);
        return results
            .stream()
            .map(LoginAttemptMapper::toUserResponse)
            .toList();
    }

    @Override
    public PageResponse<UserLoginAttemptResponse> failedAttempts(
        User user,
        Pageable pageable
    ) {
        Page<LoginAttempt> results =
            loginAttemptRepository.findByUserAndSuccessfulOrderByAttemptedAtDesc(
                user,
                false,
                pageable
            );

        return PageResponse.of(results.map(LoginAttemptMapper::toUserResponse));
    }

    @Override
    public PageResponse<UserLoginAttemptResponse> successfulAttempts(
        User user,
        Pageable pageable
    ) {
        Page<LoginAttempt> results =
            loginAttemptRepository.findByUserAndSuccessfulOrderByAttemptedAtDesc(
                user,
                true,
                pageable
            );
        return PageResponse.of(results.map(LoginAttemptMapper::toUserResponse));
    }
}
