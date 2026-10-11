package com.aardapeker.app.service;

import com.aardapeker.app.dto.request.MostActiveUsersRequest;
import com.aardapeker.app.dto.response.PageResponse;
import com.aardapeker.app.dto.UserActivityStats;
import com.aardapeker.app.dto.request.UserStatsRequest;
import com.aardapeker.app.model.User;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface TokenService {

    boolean revokeToken(String tokenString);

    int revokeAllUserTokens(UUID userId);

    int cleanupRevokedTokens(Duration olderThan);

    int cleanupAllRevokedTokens();

    void updateActivity(String tokenString);

    Page<Object[]> getMostActiveUsers(LocalDateTime startDate, Pageable pageable);

    UserActivityStats getUserActivityStats(User user, LocalDateTime startDate);

    UserActivityStats getUserActivityStatsByUserId(UserStatsRequest request);

    void closeInactiveSessions();

    PageResponse<UserActivityStats> mostActiveUsers(MostActiveUsersRequest request);
}
