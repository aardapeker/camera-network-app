package com.aardapeker.app.controller;

import com.aardapeker.app.dto.UserActivityStats;
import com.aardapeker.app.dto.request.UpdateUserDetailsRequest;
import com.aardapeker.app.dto.request.UpdateUserPasswordRequest;
import com.aardapeker.app.dto.response.ChangeDetailsResponse;
import com.aardapeker.app.dto.response.FailedLoginCountResponse;
import com.aardapeker.app.dto.response.GetMeResponse;
import com.aardapeker.app.dto.response.IsAuthenticatedResponse;
import com.aardapeker.app.dto.response.LogoutEverywhereResponse;
import com.aardapeker.app.dto.response.SuccessResponse;
import com.aardapeker.app.dto.response.UserLoginAttemptResponse;
import com.aardapeker.app.model.User;
import com.aardapeker.app.service.UserService;
import com.aardapeker.app.validation.UserValidator;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("users/me")
public class UserController {

    private final UserService userService;
    private final UserValidator userValidator;

    public UserController(UserService userService, UserValidator userValidator) {
        this.userService = userService;
        this.userValidator = userValidator;
    }

    @GetMapping("")
    public ResponseEntity<GetMeResponse> getMe(
        @AuthenticationPrincipal User user,
        HttpServletRequest request
    ) {
        return ResponseEntity.ok(userService.getMe(user, request));
    }

    @GetMapping("/isAuthenticated")
    public ResponseEntity<IsAuthenticatedResponse> isAuthenticated(
        Authentication authentication
    ) {
        return ResponseEntity.ok(userService.isAuthenticated(authentication));
    }

    @GetMapping("/login-attempts")
    public ResponseEntity<List<UserLoginAttemptResponse>> getMyLoginAttempts(
        @AuthenticationPrincipal User user,
        @RequestParam(defaultValue = "30") int days
    ) {
        userValidator.validateDaysParam(days);
        return ResponseEntity.ok(userService.getMyRecentLoginAttempts(user, days));
    }

    @GetMapping("/login-attempts/failed-count")
    public ResponseEntity<FailedLoginCountResponse> getFailedLoginCount(
        @AuthenticationPrincipal User user,
        @RequestParam(defaultValue = "30") int minutes
    ) {
        userValidator.validateMinutesParam(minutes);
        return ResponseEntity.ok(userService.getFailedLoginCount(user, minutes));
    }

    @GetMapping("/activity/my-stats")
    public ResponseEntity<UserActivityStats> getMyActivityStats(
        @AuthenticationPrincipal User user,
        @RequestParam(defaultValue = "30") int days
    ) {
        userValidator.validateDaysParam(days);
        return ResponseEntity.ok(userService.getMyActivityStats(user, days));
    }

    @PostMapping("/logout")
    public ResponseEntity<SuccessResponse> logout(
        @AuthenticationPrincipal User user,
        @RequestHeader("Authorization") String authHeader
    ) {
        userValidator.validateAuthHeader(authHeader);
        return ResponseEntity.ok(userService.logout(user, authHeader));
    }

    @PostMapping("/logout-everywhere")
    public ResponseEntity<LogoutEverywhereResponse> logoutEverywhere(
        @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(userService.logoutEverywhere(user));
    }

    @PostMapping("/activity/heartbeat")
    public ResponseEntity<SuccessResponse> updateActivity(
        @AuthenticationPrincipal User user,
        @RequestHeader("Authorization") String authHeader
    ) {
        userValidator.validateAuthHeader(authHeader);
        return ResponseEntity.ok(userService.updateActivity(user, authHeader));
    }

    @PutMapping("/change-password")
    public ResponseEntity<SuccessResponse> changePassword(
        @AuthenticationPrincipal User user,
        @Valid @RequestBody UpdateUserPasswordRequest request
    ) {
        return ResponseEntity.ok(userService.changePassword(user, request));
    }

    @PutMapping("/change-details")
    public ResponseEntity<ChangeDetailsResponse> changeDetails(
        @AuthenticationPrincipal User user,
        @RequestBody UpdateUserDetailsRequest request
    ) {
        return ResponseEntity.ok(userService.changeDetails(user, request));
    }

    @DeleteMapping("")
    public ResponseEntity<SuccessResponse> deleteMe(
        @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(userService.deleteMe(user));
    }
}
