package com.aardapeker.app.service;

import com.aardapeker.app.dto.UserActivityStats;
import com.aardapeker.app.dto.request.AddUserRequest;
import com.aardapeker.app.model.Role;
import com.aardapeker.app.dto.request.FailedLoginAttemptsRequest;
import com.aardapeker.app.dto.request.GetUsersRequest;
import com.aardapeker.app.dto.request.LoginAttemptsByIpRequest;
import com.aardapeker.app.dto.request.LoginAttemptsRequest;
import com.aardapeker.app.dto.request.MostActiveUsersRequest;
import com.aardapeker.app.dto.request.SearchLoginAttemptsRequest;
import com.aardapeker.app.dto.request.SuccessfulLoginAttemptsRequest;
import com.aardapeker.app.dto.request.UpdateUserDetailsRequest;
import com.aardapeker.app.dto.response.AdminLoginAttemptResponse;
import com.aardapeker.app.dto.response.DeleteUsersResponse;
import com.aardapeker.app.dto.response.LoginStatisticsResponse;
import com.aardapeker.app.dto.response.PageResponse;
import com.aardapeker.app.dto.response.UserResponse;
import com.aardapeker.app.model.CustomPermission;
import com.aardapeker.app.model.Status;
import com.aardapeker.app.model.User;
import java.time.Duration;
import java.util.List;
import java.util.Set;
import java.util.UUID;

public interface AdminService {

    // User management
    User addUser(AddUserRequest request);

    User updateUser(String username, UpdateUserDetailsRequest request);

    User updateUserStatus(UUID userId, Status status);

    DeleteUsersResponse deleteUsers(List<UUID> userIds);

    // User queries (delegate from UserService)
    UserResponse getUser(UUID userId);

    UserResponse getUserByUsername(String username);

    UserResponse getUserByEmail(String email);

    PageResponse<UserResponse> getUsers(GetUsersRequest request);

    // Login attempts (delegate from LoginAttemptService)
    PageResponse<AdminLoginAttemptResponse> getLoginAttempts(LoginAttemptsRequest request);

    PageResponse<AdminLoginAttemptResponse> searchLoginAttempts(SearchLoginAttemptsRequest request);

    PageResponse<AdminLoginAttemptResponse> failedLoginAttempts(FailedLoginAttemptsRequest request);

    PageResponse<AdminLoginAttemptResponse> successfulLoginAttempts(SuccessfulLoginAttemptsRequest request);

    PageResponse<AdminLoginAttemptResponse> loginAttemptsByIpAddress(LoginAttemptsByIpRequest request);

    LoginStatisticsResponse getLoginStatistics();

    // Token management (delegate from TokenService)
    int cleanupRevokedTokens(Duration olderThan);

    int cleanupAllRevokedTokens();

    PageResponse<UserActivityStats> getMostActiveUsers(MostActiveUsersRequest request);

    UserActivityStats getUserActivityStats(UUID userId, Integer days);

    // Custom role permissions
    Set<CustomPermission> getCustomPermissions(String username);

    void updateCustomPermissions(String username, Set<CustomPermission> permissions);

    // Role management
    User updateUserRole(String username, Role role);
}
