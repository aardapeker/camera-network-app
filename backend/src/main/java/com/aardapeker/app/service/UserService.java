package com.aardapeker.app.service;

import com.aardapeker.app.dto.UserActivityStats;
import com.aardapeker.app.dto.request.GetUsersRequest;
import com.aardapeker.app.dto.request.UpdateUserDetailsRequest;
import com.aardapeker.app.dto.request.UpdateUserPasswordRequest;
import com.aardapeker.app.dto.response.ChangeDetailsResponse;
import com.aardapeker.app.dto.response.DeleteUsersResult;
import com.aardapeker.app.dto.response.FailedLoginCountResponse;
import com.aardapeker.app.dto.response.GetMeResponse;
import com.aardapeker.app.dto.response.IsAuthenticatedResponse;
import com.aardapeker.app.dto.response.LogoutEverywhereResponse;
import com.aardapeker.app.dto.response.PageResponse;
import com.aardapeker.app.dto.response.SuccessResponse;
import com.aardapeker.app.dto.response.UserLoginAttemptResponse;
import com.aardapeker.app.dto.response.UserResponse;
import com.aardapeker.app.model.User;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;

public interface UserService {

    // Query methods (used by other services)
    UserResponse getUser(UUID userId);

    UserResponse getUserByUsername(String username);

    UserResponse getUserByEmail(String email);

    PageResponse<UserResponse> getUsers(GetUsersRequest request);

    Page<User> getAllUsers(Pageable pageable);

    Optional<User> getUserById(UUID id);

    Optional<User> getByUsername(String username);

    Optional<User> getByEmail(String email);

    Optional<User> findByUsernameOrEmail(String identifier);

    // Write methods (used by other services)
    void addUser(User user);

    User updateUser(String username, UpdateUserDetailsRequest request);

    void updateProfilePictureUrl(String username, String profilePictureUrl);

    DeleteUsersResult deleteUsers(List<UUID> userIds);

    // Current user endpoints
    IsAuthenticatedResponse isAuthenticated(Authentication authentication);

    GetMeResponse getMe(User principal, HttpServletRequest request);

    List<UserLoginAttemptResponse> getMyRecentLoginAttempts(User principal, int days);

    FailedLoginCountResponse getFailedLoginCount(User principal, int minutes);

    UserActivityStats getMyActivityStats(User principal, int days);

    SuccessResponse logout(User principal, String authHeader);

    LogoutEverywhereResponse logoutEverywhere(User principal);

    SuccessResponse updateActivity(User principal, String authHeader);

    SuccessResponse changePassword(User principal, UpdateUserPasswordRequest request);

    ChangeDetailsResponse changeDetails(User principal, UpdateUserDetailsRequest request);

    SuccessResponse deleteMe(User principal);
}
