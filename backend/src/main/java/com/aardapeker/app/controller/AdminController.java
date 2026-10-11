package com.aardapeker.app.controller;

import com.aardapeker.app.dto.UserActivityStats;
import com.aardapeker.app.dto.request.AddUserRequest;
import com.aardapeker.app.model.CustomPermission;
import java.util.Set;
import com.aardapeker.app.dto.request.FailedLoginAttemptsRequest;
import com.aardapeker.app.dto.request.GetUsersRequest;
import com.aardapeker.app.dto.request.LoginAttemptsByIpRequest;
import com.aardapeker.app.dto.request.LoginAttemptsRequest;
import com.aardapeker.app.dto.request.MostActiveUsersRequest;
import com.aardapeker.app.dto.request.SearchLoginAttemptsRequest;
import com.aardapeker.app.dto.request.SuccessfulLoginAttemptsRequest;
import com.aardapeker.app.dto.request.UpdateUserDetailsRequest;
import com.aardapeker.app.dto.request.UpdateUserRoleRequest;
import com.aardapeker.app.dto.request.UpdateUserStatusRequest;
import com.aardapeker.app.dto.response.AdminLoginAttemptResponse;
import com.aardapeker.app.dto.response.CleanupTokensResponse;
import com.aardapeker.app.dto.response.DeleteUsersResponse;
import com.aardapeker.app.dto.response.IsAdminResponse;
import com.aardapeker.app.dto.response.LoginStatisticsResponse;
import com.aardapeker.app.dto.response.PageResponse;
import com.aardapeker.app.dto.response.RestrictedUserResponse;
import com.aardapeker.app.dto.response.TestResponse;
import com.aardapeker.app.dto.response.UserResponse;
import com.aardapeker.app.dto.response.UserStatusChangeResponse;
import com.aardapeker.app.mapper.AdminMapper;
import com.aardapeker.app.model.User;
import com.aardapeker.app.service.AdminService;
import com.aardapeker.app.validation.AdminValidator;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.time.Duration;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@Validated
public class AdminController {

    private final AdminService adminService;
    private final AdminValidator adminValidator;
    private final AdminMapper adminMapper;

    public AdminController(
        AdminService adminService,
        AdminValidator adminValidator,
        AdminMapper adminMapper
    ) {
        this.adminService = adminService;
        this.adminValidator = adminValidator;
        this.adminMapper = adminMapper;
    }

    @GetMapping("")
    public ResponseEntity<TestResponse> test() {
        return ResponseEntity.ok(adminMapper.toTestResponse());
    }

    @GetMapping("/isAdmin")
    public ResponseEntity<IsAdminResponse> isAdmin() {
        return ResponseEntity.ok(adminMapper.toIsAdminResponse());
    }

    @GetMapping("/{userId}")
    public ResponseEntity<UserResponse> getUser(@PathVariable UUID userId) {
        UserResponse response = adminService.getUser(userId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/getUserByUsername")
    public ResponseEntity<UserResponse> getUserByUsername(
        @RequestParam @NotBlank(
            message = "Username is required"
        ) String username
    ) {
        UserResponse response = adminService.getUserByUsername(username);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/getUserByEmail")
    public ResponseEntity<UserResponse> getUserByEmail(
        @RequestParam @NotBlank(message = "Email is required") String email
    ) {
        UserResponse response = adminService.getUserByEmail(email);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/users")
    public ResponseEntity<PageResponse<UserResponse>> getUsers(
        GetUsersRequest request
    ) {
        PageResponse<UserResponse> response = adminService.getUsers(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/login-attempts")
    public ResponseEntity<
        PageResponse<AdminLoginAttemptResponse>
    > loginAttempts(LoginAttemptsRequest request) {
        PageResponse<AdminLoginAttemptResponse> response =
            adminService.getLoginAttempts(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/login-attempts/search")
    public ResponseEntity<
        PageResponse<AdminLoginAttemptResponse>
    > searchLoginAttempts(@Valid SearchLoginAttemptsRequest request) {
        PageResponse<AdminLoginAttemptResponse> response =
            adminService.searchLoginAttempts(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/login-attempts/failed")
    public ResponseEntity<
        PageResponse<AdminLoginAttemptResponse>
    > failedLoginAttempts(FailedLoginAttemptsRequest request) {
        PageResponse<AdminLoginAttemptResponse> response =
            adminService.failedLoginAttempts(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/login-attempts/successful")
    public ResponseEntity<
        PageResponse<AdminLoginAttemptResponse>
    > successfulLoginAttempts(SuccessfulLoginAttemptsRequest request) {
        PageResponse<AdminLoginAttemptResponse> response =
            adminService.successfulLoginAttempts(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/login-attempts/by-ip")
    public ResponseEntity<
        PageResponse<AdminLoginAttemptResponse>
    > searchByIpAddress(LoginAttemptsByIpRequest request) {
        PageResponse<AdminLoginAttemptResponse> response =
            adminService.loginAttemptsByIpAddress(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/login-attempts/statistics")
    public ResponseEntity<LoginStatisticsResponse> loginStatistics() {
        LoginStatisticsResponse response = adminService.getLoginStatistics();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/users/most-active")
    public ResponseEntity<PageResponse<UserActivityStats>> mostActiveUsers(
        MostActiveUsersRequest request
    ) {
        PageResponse<UserActivityStats> response =
            adminService.getMostActiveUsers(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/users/{userId}/stats")
    public ResponseEntity<UserActivityStats> userStats(
        @PathVariable UUID userId,
        @RequestParam(defaultValue = "30") Integer days
    ) {
        UserActivityStats stats = adminService.getUserActivityStats(
            userId,
            days
        );
        return ResponseEntity.ok(stats);
    }

    @PatchMapping("/update/{username}")
    public ResponseEntity<RestrictedUserResponse> updateUser(
        @PathVariable @NotBlank String username,
        @Valid @RequestBody UpdateUserDetailsRequest request
    ) {
        User updatedUser = adminService.updateUser(username, request);
        return ResponseEntity.ok(adminMapper.toUpdateUserResponse(updatedUser));
    }

    @PostMapping("/users")
    public ResponseEntity<RestrictedUserResponse> addUser(
        @Valid @RequestBody AddUserRequest request
    ) {
        adminValidator.validateForAddUser(request);
        User user = adminService.addUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(
            adminMapper.toAddUserResponse(user)
        );
    }

    @PostMapping("/tokens/cleanup")
    public ResponseEntity<CleanupTokensResponse> cleanupOldTokens(
        @RequestParam(defaultValue = "30") Integer days
    ) {
        int safeDays = adminValidator.validateAndNormalizeCleanupDays(days);
        int deletedCount = adminService.cleanupRevokedTokens(
            Duration.ofDays(safeDays)
        );
        return ResponseEntity.ok(adminMapper.toCleanupResponse(deletedCount));
    }

    @PostMapping("/tokens/cleanup/all")
    public ResponseEntity<CleanupTokensResponse> cleanupAllTokens() {
        int deletedCount = adminService.cleanupAllRevokedTokens();
        return ResponseEntity.ok(adminMapper.toCleanupResponse(deletedCount));
    }

    @PutMapping("/users/{userId}/status")
    public ResponseEntity<UserStatusChangeResponse> updateStatus(
        @PathVariable UUID userId,
        @Valid @RequestBody UpdateUserStatusRequest request
    ) {
        adminValidator.validateForUpdateStatus(request);
        User user = adminService.updateUserStatus(userId, request.status());
        return ResponseEntity.ok(adminMapper.toStatusChangeResponse(user));
    }

    @PostMapping("/users/batch-delete")
    public ResponseEntity<DeleteUsersResponse> batchDelete(
        @RequestBody List<UUID> userIds
    ) {
        adminValidator.validateForBatchDelete(userIds);
        DeleteUsersResponse response = adminService.deleteUsers(userIds);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/users/{username}/role")
    public ResponseEntity<RestrictedUserResponse> updateUserRole(
        @PathVariable @NotBlank String username,
        @Valid @RequestBody UpdateUserRoleRequest request
    ) {
        User user = adminService.updateUserRole(username, request.role());
        return ResponseEntity.ok(adminMapper.toUpdateUserResponse(user));
    }

    @GetMapping("/users/{username}/permissions")
    public ResponseEntity<Set<CustomPermission>> getCustomPermissions(
        @PathVariable @NotBlank String username
    ) {
        return ResponseEntity.ok(adminService.getCustomPermissions(username));
    }

    @PutMapping("/users/{username}/permissions")
    public ResponseEntity<Void> updateCustomPermissions(
        @PathVariable @NotBlank String username,
        @RequestBody Set<CustomPermission> permissions
    ) {
        adminService.updateCustomPermissions(username, permissions);
        return ResponseEntity.noContent().build();
    }
}
