package com.aardapeker.app.service.impl;

import com.aardapeker.app.dto.UserActivityStats;
import com.aardapeker.app.dto.request.AddUserRequest;
import com.aardapeker.app.model.CustomPermission;
import com.aardapeker.app.model.Role;
import com.aardapeker.app.model.UserPermission;
import com.aardapeker.app.repository.UserPermissionRepository;
import java.util.EnumSet;
import java.util.Set;
import java.util.stream.Collectors;
import com.aardapeker.app.dto.request.FailedLoginAttemptsRequest;
import com.aardapeker.app.dto.request.GetUsersRequest;
import com.aardapeker.app.dto.request.LoginAttemptsByIpRequest;
import com.aardapeker.app.dto.request.LoginAttemptsRequest;
import com.aardapeker.app.dto.request.MostActiveUsersRequest;
import com.aardapeker.app.dto.request.SearchLoginAttemptsRequest;
import com.aardapeker.app.dto.request.SuccessfulLoginAttemptsRequest;
import com.aardapeker.app.dto.request.UpdateUserDetailsRequest;
import com.aardapeker.app.dto.request.UserStatsRequest;
import com.aardapeker.app.dto.response.AdminLoginAttemptResponse;
import com.aardapeker.app.dto.response.DeleteUsersResponse;
import com.aardapeker.app.dto.response.DeleteUsersResult;
import com.aardapeker.app.dto.response.LoginStatisticsResponse;
import com.aardapeker.app.dto.response.PageResponse;
import com.aardapeker.app.dto.response.UserResponse;
import com.aardapeker.app.exception.BadRequestException;
import com.aardapeker.app.exception.ResourceNotFoundException;
import com.aardapeker.app.model.Status;
import com.aardapeker.app.model.Token;
import com.aardapeker.app.model.User;
import com.aardapeker.app.policy.AdminPolicy;
import com.aardapeker.app.repository.TokenRepository;
import com.aardapeker.app.repository.TopologyRepository;
import com.aardapeker.app.repository.UserRepository;
import com.aardapeker.app.service.AdminService;
import com.aardapeker.app.service.LoginAttemptService;
import com.aardapeker.app.service.TokenService;
import com.aardapeker.app.service.UserService;
import java.time.Duration;
import java.util.List;
import java.util.UUID;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;
    private final TokenRepository tokenRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final AdminPolicy adminPolicy;
    private final UserService userService;
    private final LoginAttemptService loginAttemptService;
    private final TokenService tokenService;
    private final UserPermissionRepository userPermissionRepository;
    private final TopologyRepository topologyRepository;

    public AdminServiceImpl(
        UserRepository userRepository,
        TokenRepository tokenRepository,
        BCryptPasswordEncoder passwordEncoder,
        AdminPolicy adminPolicy,
        UserService userService,
        LoginAttemptService loginAttemptService,
        TokenService tokenService,
        UserPermissionRepository userPermissionRepository,
        TopologyRepository topologyRepository
    ) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.adminPolicy = adminPolicy;
        this.userService = userService;
        this.loginAttemptService = loginAttemptService;
        this.tokenService = tokenService;
        this.userPermissionRepository = userPermissionRepository;
        this.topologyRepository = topologyRepository;
    }

    // ===== User Management =====

    @Override
    @Transactional
    public User addUser(AddUserRequest request) {
        adminPolicy.validateUsernameNotTaken(request.username());
        adminPolicy.validateEmailNotTaken(request.email());

        User user = User.builder()
            .firstName(request.firstName())
            .lastName(request.lastName())
            .username(request.username())
            .email(request.email())
            .password(passwordEncoder.encode(request.password()))
            .profilePictureUrl(request.profilePictureUrl())
            .authorities(request.authorities())
            .accountNonExpired(true)
            .credentialsNonExpired(true)
            .isEnabled(true)
            .accountNonLocked(true)
            .build();

        return userRepository.save(user);
    }

    @Override
    @Transactional
    public User updateUser(String username, UpdateUserDetailsRequest request) {
        return userService.updateUser(username, request);
    }

    @Override
    @Transactional
    public User updateUserStatus(UUID userId, Status status) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        adminPolicy.validateStatusTransition(user, status);

        switch (status) {
            case BANNED -> {
                user.setAccountNonLocked(false);
                revokeAllUserTokens(userId);
            }
            case ACTIVE -> user.setAccountNonLocked(true);
            default -> throw new BadRequestException("Unsupported status: " + status);
        }

        return userRepository.save(user);
    }

    @Override
    @Transactional
    public DeleteUsersResponse deleteUsers(List<UUID> userIds) {
        DeleteUsersResult result = userService.deleteUsers(userIds);
        return DeleteUsersResponse.from(result);
    }

    // ===== User Queries (delegated) =====

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUser(UUID userId) {
        return userService.getUser(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserByUsername(String username) {
        return userService.getUserByUsername(username);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserByEmail(String email) {
        return userService.getUserByEmail(email);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<UserResponse> getUsers(GetUsersRequest request) {
        return userService.getUsers(request);
    }

    // ===== Login Attempts (delegated) =====

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AdminLoginAttemptResponse> getLoginAttempts(LoginAttemptsRequest request) {
        return loginAttemptService.getLoginAttempts(request);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AdminLoginAttemptResponse> searchLoginAttempts(SearchLoginAttemptsRequest request) {
        return loginAttemptService.searchLoginAttempts(request);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AdminLoginAttemptResponse> failedLoginAttempts(FailedLoginAttemptsRequest request) {
        return loginAttemptService.failedLoginAttempts(request);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AdminLoginAttemptResponse> successfulLoginAttempts(SuccessfulLoginAttemptsRequest request) {
        return loginAttemptService.successfulLoginAttempts(request);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AdminLoginAttemptResponse> loginAttemptsByIpAddress(LoginAttemptsByIpRequest request) {
        return loginAttemptService.loginAttemptsByIpAddress(request);
    }

    @Override
    @Transactional(readOnly = true)
    public LoginStatisticsResponse getLoginStatistics() {
        return loginAttemptService.loginStatistics();
    }

    // ===== Token Management (delegated) =====

    @Override
    @Transactional
    public int cleanupRevokedTokens(Duration olderThan) {
        return tokenService.cleanupRevokedTokens(olderThan);
    }

    @Override
    @Transactional
    public int cleanupAllRevokedTokens() {
        return tokenService.cleanupAllRevokedTokens();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<UserActivityStats> getMostActiveUsers(MostActiveUsersRequest request) {
        return tokenService.mostActiveUsers(request);
    }

    @Override
    @Transactional(readOnly = true)
    public UserActivityStats getUserActivityStats(UUID userId, Integer days) {
        UserStatsRequest request = new UserStatsRequest(userId, days);
        return tokenService.getUserActivityStatsByUserId(request);
    }

    // ===== Custom Role Permissions =====

    @Override
    @Transactional(readOnly = true)
    public Set<CustomPermission> getCustomPermissions(String username) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        return userPermissionRepository.findByUser(user).stream()
            .map(UserPermission::getPermission)
            .collect(Collectors.toCollection(() -> EnumSet.noneOf(CustomPermission.class)));
    }

    @Override
    @Transactional
    public void updateCustomPermissions(String username, Set<CustomPermission> permissions) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        if (!user.hasRole(Role.ROLE_CUSTOM)) {
            throw new BadRequestException("Permissions can only be set for ROLE_CUSTOM users");
        }
        userPermissionRepository.deleteByUser(user);
        if (permissions != null && !permissions.isEmpty()) {
            userPermissionRepository.saveAll(
                permissions.stream().map(p -> new UserPermission(user, p)).toList()
            );
        }
    }

    // ===== Role Management =====

    @Override
    @Transactional
    public User updateUserRole(String username, Role role) {
        if (role == Role.ROLE_ADMIN) {
            throw new BadRequestException("Cannot assign ROLE_ADMIN via this endpoint");
        }
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        if (user.hasRole(Role.ROLE_ADMIN)) {
            throw new BadRequestException("Cannot change the role of an admin user");
        }
        boolean wasClient = user.hasRole(Role.ROLE_CLIENT);
        user.getAuthorities().clear();
        user.getAuthorities().add(role);
        // If switching away from ROLE_CUSTOM, clear custom permissions
        if (role != Role.ROLE_CUSTOM) {
            userPermissionRepository.deleteByUser(user);
        }
        // If switching away from ROLE_CLIENT, unassign their topologies
        if (wasClient) {
            topologyRepository.unassignTopologiesByUserId(user.getId());
        }
        return userRepository.save(user);
    }

    // ===== Private Helpers =====

    private void revokeAllUserTokens(UUID userId) {
        List<Token> validTokens = tokenRepository.findAllValidTokenByUser(userId);
        if (validTokens.isEmpty()) {
            return;
        }

        validTokens.forEach(token -> {
            token.setRevoked(true);
            token.setExpired(true);
        });

        tokenRepository.saveAll(validTokens);
    }
}
