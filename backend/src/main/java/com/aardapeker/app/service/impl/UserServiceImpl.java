package com.aardapeker.app.service.impl;

import com.aardapeker.app.dto.UserActivityStats;
import com.aardapeker.app.dto.request.GetUsersRequest;
import com.aardapeker.app.model.CustomPermission;
import com.aardapeker.app.model.Role;
import com.aardapeker.app.model.UserPermission;
import com.aardapeker.app.repository.TopologyRepository;
import com.aardapeker.app.repository.UserPermissionRepository;
import java.util.Collections;
import java.util.EnumSet;
import java.util.Set;
import java.util.stream.Collectors;
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
import com.aardapeker.app.exception.BadRequestException;
import com.aardapeker.app.exception.ForbiddenActionException;
import com.aardapeker.app.exception.ResourceNotFoundException;
import com.aardapeker.app.model.FilterBy;
import com.aardapeker.app.model.User;
import com.aardapeker.app.policy.UserPolicy;
import com.aardapeker.app.repository.UserRepository;
import com.aardapeker.app.security.SecurityUtils;
import com.aardapeker.app.service.LoginAttemptService;
import com.aardapeker.app.service.LoginAttemptUserService;
import com.aardapeker.app.service.TokenService;
import com.aardapeker.app.service.UserService;
import com.aardapeker.app.mapper.UserMapper;
import com.aardapeker.app.util.UserSpecifications;
import com.aardapeker.app.validation.TextFilterValidator;
import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final LoginAttemptService loginAttemptService;
    private final LoginAttemptUserService loginAttemptUserService;
    private final TokenService tokenService;
    private final TextFilterValidator textFilterValidator;
    private final UserPolicy userPolicy;
    private final UserMapper userMapper;
    private final UserPermissionRepository userPermissionRepository;
    private final TopologyRepository topologyRepository;

    public UserServiceImpl(
        UserRepository userRepository,
        BCryptPasswordEncoder passwordEncoder,
        LoginAttemptService loginAttemptService,
        LoginAttemptUserService loginAttemptUserService,
        TokenService tokenService,
        TextFilterValidator textFilterValidator,
        UserPolicy userPolicy,
        UserMapper userMapper,
        UserPermissionRepository userPermissionRepository,
        TopologyRepository topologyRepository
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.loginAttemptService = loginAttemptService;
        this.loginAttemptUserService = loginAttemptUserService;
        this.tokenService = tokenService;
        this.textFilterValidator = textFilterValidator;
        this.userPolicy = userPolicy;
        this.userMapper = userMapper;
        this.userPermissionRepository = userPermissionRepository;
        this.topologyRepository = topologyRepository;
    }

    // Query methods

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUser(UUID userId) {
        User user = findUserById(userId);
        return userMapper.toResponse(user);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserByUsername(String username) {
        User user = findUserByUsername(username);
        return userMapper.toResponse(user);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserByEmail(String email) {
        User user = userRepository
            .findByEmail(email)
            .orElseThrow(() ->
                new ResourceNotFoundException("User not found with email: " + email)
            );
        return userMapper.toResponse(user);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<UserResponse> getUsers(GetUsersRequest request) {
        textFilterValidator.validateTextFilter(request);

        Sort.Direction direction = request.sortDirection().equalsIgnoreCase("DESC")
            ? Sort.Direction.DESC
            : Sort.Direction.ASC;

        Pageable pageable = PageRequest.of(
            request.page(),
            request.size(),
            Sort.by(direction, request.sortBy())
        );

        Specification<User> spec = buildUserSpecification(request);
        Page<User> users = userRepository.findAll(spec, pageable);
        Page<UserResponse> mapped = users.map(userMapper::toResponse);

        return PageResponse.of(mapped);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<User> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<User> getUserById(UUID id) {
        return userRepository.findById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<User> getByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<User> getByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<User> findByUsernameOrEmail(String identifier) {
        return userRepository
            .findByUsername(identifier)
            .or(() -> userRepository.findByEmail(identifier));
    }

    // Write methods

    @Override
    @Transactional
    public void addUser(User user) {
        userRepository.save(user);
    }

    @Override
    @Transactional
    public User updateUser(String username, UpdateUserDetailsRequest request) {
        User user = findUserByUsername(username);

        boolean updated = false;
        if (request.firstName() != null) {
            user.setFirstName(request.firstName());
            updated = true;
        }
        if (request.lastName() != null) {
            user.setLastName(request.lastName());
            updated = true;
        }

        if (!updated) {
            throw new BadRequestException("No fields provided for update");
        }

        return userRepository.save(user);
    }

    @Override
    @Transactional
    public void updateProfilePictureUrl(String username, String profilePictureUrl) {
        User user = findUserByUsername(username);
        user.setProfilePictureUrl(profilePictureUrl);
        userRepository.save(user);
    }

    @Override
    @Transactional
    public DeleteUsersResult deleteUsers(List<UUID> userIds) {
        List<String> successful = new ArrayList<>();
        List<String> failed = new ArrayList<>();
        List<String> adminUsers = new ArrayList<>();

        for (UUID userId : userIds) {
            try {
                User user = findUserById(userId);
                userPolicy.validateUserDeletable(user);

                topologyRepository.unassignTopologiesByUserId(user.getId());
                userRepository.delete(user);
                successful.add(userId.toString());
            } catch (ResourceNotFoundException e) {
                failed.add(userId.toString());
            } catch (ForbiddenActionException e) {
                adminUsers.add(userId.toString());
            } catch (Exception e) {
                failed.add(userId.toString());
            }
        }

        return new DeleteUsersResult(successful, failed, adminUsers);
    }

    // Current user endpoints

    @Override
    @Transactional(readOnly = true)
    public IsAuthenticatedResponse isAuthenticated(Authentication authentication) {
        boolean authenticated = authentication != null &&
            authentication.getPrincipal() != null;
        return new IsAuthenticatedResponse(authenticated);
    }

    @Override
    @Transactional(readOnly = true)
    public GetMeResponse getMe(User principal, HttpServletRequest request) {
        String ipAddress = request.getRemoteAddr();
        Set<CustomPermission> customPermissions = principal.hasRole(Role.ROLE_CUSTOM)
            ? userPermissionRepository.findByUser(principal).stream()
                .map(UserPermission::getPermission)
                .collect(Collectors.toCollection(() -> EnumSet.noneOf(CustomPermission.class)))
            : Collections.emptySet();
        boolean isAdmin = SecurityUtils.hasRole(principal, "ROLE_ADMIN")
            || SecurityUtils.hasRole(principal, "ROLE_DEVELOPER")
            || SecurityUtils.hasRole(principal, "ROLE_MANAGER")
            || customPermissions.contains(CustomPermission.ACCESS_ADMIN_PANEL);
        boolean isClient = SecurityUtils.hasRole(principal, "ROLE_CLIENT");
        String role = principal.getAuthorities().stream()
            .findFirst()
            .map(GrantedAuthority::getAuthority)
            .orElse(null);
        return userMapper.toGetMeResponse(principal, ipAddress, isAdmin, isClient, role, customPermissions);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserLoginAttemptResponse> getMyRecentLoginAttempts(
        User principal,
        int days
    ) {
        return loginAttemptUserService.recentAttempts(principal, days);
    }

    @Override
    @Transactional(readOnly = true)
    public FailedLoginCountResponse getFailedLoginCount(User principal, int minutes) {
        String email = principal.getEmail();
        long failedCount = loginAttemptService.countRecentFailedAttempts(email, minutes);
        return new FailedLoginCountResponse(failedCount, minutes);
    }

    @Override
    @Transactional(readOnly = true)
    public UserActivityStats getMyActivityStats(User principal, int days) {
        LocalDateTime startDate = LocalDateTime.now().minusDays(days);
        return tokenService.getUserActivityStats(principal, startDate);
    }

    @Override
    @Transactional
    public SuccessResponse logout(User principal, String authHeader) {
        String token = SecurityUtils.extractBearerToken(authHeader);
        boolean revoked = tokenService.revokeToken(token);

        if (!revoked) {
            throw new ResourceNotFoundException("Token already revoked or not found");
        }

        return new SuccessResponse("Logged out successfully from this device");
    }

    @Override
    @Transactional
    public LogoutEverywhereResponse logoutEverywhere(User principal) {
        UUID currentUserId = principal.getId();
        int revokedCount = tokenService.revokeAllUserTokens(currentUserId);
        return new LogoutEverywhereResponse(
            "Successfully logged out from all devices",
            revokedCount
        );
    }

    @Override
    @Transactional
    public SuccessResponse updateActivity(User principal, String authHeader) {
        String token = SecurityUtils.extractBearerToken(authHeader);
        tokenService.updateActivity(token);
        return new SuccessResponse("Activity updated");
    }

    @Override
    @Transactional
    public SuccessResponse changePassword(
        User principal,
        UpdateUserPasswordRequest request
    ) {
        userPolicy.validatePasswordMatch(
            request.currentPassword(),
            principal.getPassword(),
            passwordEncoder
        );

        User user = findUserByUsername(principal.getUsername());
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        return new SuccessResponse("Password changed successfully");
    }

    @Override
    @Transactional
    public ChangeDetailsResponse changeDetails(
        User principal,
        UpdateUserDetailsRequest request
    ) {
        User user = findUserByUsername(principal.getUsername());
        userMapper.updateUserDetails(user, request);
        userRepository.save(user);
        return userMapper.toChangeDetailsResponse(user);
    }

    @Override
    @Transactional
    public SuccessResponse deleteMe(User principal) {
        User user = findUserByUsername(principal.getUsername());
        userPolicy.validateUserCanDeleteSelf(user);

        userRepository.delete(user);

        return new SuccessResponse("Account successfully deleted");
    }

    // Private helper methods

    private User findUserById(UUID userId) {
        return userRepository
            .findById(userId)
            .orElseThrow(() ->
                new ResourceNotFoundException("User not found with id: " + userId)
            );
    }

    private User findUserByUsername(String username) {
        return userRepository
            .findByUsername(username)
            .orElseThrow(() ->
                new ResourceNotFoundException("User not found: " + username)
            );
    }

    private Specification<User> buildUserSpecification(GetUsersRequest request) {
        Specification<User> spec = Specification.where(null);

        if (request.filterBy() != null && request.filterInput() != null) {
            spec = spec.and(
                UserSpecifications.textFilter(
                    FilterBy.from(request.filterBy()),
                    request.filterInput()
                )
            );
        }

        if (request.roles() != null && !request.roles().isEmpty()) {
            spec = spec.and(UserSpecifications.hasRoles(request.roles()));
        }

        if (request.statuses() != null && !request.statuses().isEmpty()) {
            spec = spec.and(UserSpecifications.hasStatuses(request.statuses()));
        }

        return spec;
    }
}
