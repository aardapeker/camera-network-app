package com.aardapeker.app.service;

import com.aardapeker.app.dto.response.PageResponse;
import com.aardapeker.app.dto.response.UserLoginAttemptResponse;
import com.aardapeker.app.model.User;
import java.util.List;
import org.springframework.data.domain.Pageable;

public interface LoginAttemptUserService {

    PageResponse<UserLoginAttemptResponse> loginAttempts(User user, Pageable pageable);

    List<UserLoginAttemptResponse> recentAttempts(User user, int days);

    PageResponse<UserLoginAttemptResponse> failedAttempts(User user, Pageable pageable);

    PageResponse<UserLoginAttemptResponse> successfulAttempts(User user, Pageable pageable);
}
