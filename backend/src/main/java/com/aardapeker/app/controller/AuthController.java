package com.aardapeker.app.controller;

import com.aardapeker.app.dto.VerifyResult;
import com.aardapeker.app.dto.request.AuthRequest;
import com.aardapeker.app.dto.request.RegisterUserRequest;
import com.aardapeker.app.dto.request.ResendCodeRequest;
import com.aardapeker.app.dto.request.ResetPasswordLinkRequest;
import com.aardapeker.app.dto.request.ResetPasswordRequest;
import com.aardapeker.app.dto.request.VerifyUserRequest;
import com.aardapeker.app.dto.response.AuthResponse;
import com.aardapeker.app.dto.response.ResendCodeResponse;
import com.aardapeker.app.dto.response.ResetPasswordLinkResponse;
import com.aardapeker.app.dto.response.RestrictedUserResponse;
import com.aardapeker.app.dto.response.SuccessResponse;
import com.aardapeker.app.dto.response.VerifyUserResponse;
import com.aardapeker.app.model.User;
import com.aardapeker.app.service.AuthService;
import com.aardapeker.app.mapper.AuthMapper;
import com.aardapeker.app.validation.AuthValidator;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;
    private final AuthValidator authValidator;
    private final AuthMapper authMapper;

    public AuthController(
            AuthService authService,
            AuthValidator authValidator,
            AuthMapper authMapper) {
        this.authService = authService;
        this.authValidator = authValidator;
        this.authMapper = authMapper;
    }

    @PostMapping("/signup")
    public ResponseEntity<RestrictedUserResponse> signup(
            @Valid @RequestBody RegisterUserRequest request) {
        User user = authService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(authMapper.toSignupResponse(user));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody AuthRequest request,
            HttpServletRequest httpRequest) {
        authValidator.validateLoginRequest(request);
        AuthResponse response = authService.login(request, httpRequest);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify")
    public ResponseEntity<VerifyUserResponse> verify(
            @Valid @RequestBody VerifyUserRequest request,
            HttpServletRequest httpRequest) {
        authValidator.validateEmail(request.email());
        authValidator.validateVerificationCode(request.verificationCode());
        VerifyResult result = authService.verifyUserAndGenerateToken(request, httpRequest);
        return ResponseEntity.ok(
                authMapper.toVerifyResponse(result.user(), result.token()));
    }

    @PostMapping("/resend-verification-code")
    public ResponseEntity<ResendCodeResponse> resendVerificationCode(
            @Valid @RequestBody ResendCodeRequest request) {
        authValidator.validateEmail(request.email());
        authService.resendVerificationCode(request.email());
        return ResponseEntity.ok(authMapper.toResendCodeResponse(request.email()));
    }

    @PostMapping("/sentResetPasswordLink")
    public ResponseEntity<ResetPasswordLinkResponse> sendResetPasswordLink(
            @Valid @RequestBody ResetPasswordLinkRequest request) {
        authValidator.validateEmail(request.email());
        authService.sendResetPasswordLink(request.email());
        return ResponseEntity.ok(authMapper.toResetLinkResponse(request.email()));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<SuccessResponse> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        authValidator.validateEmail(request.email());
        authValidator.validateResetToken(request.token());
        authValidator.validatePassword(request.password());
        authService.resetPassword(request);
        return ResponseEntity.ok(authMapper.toPasswordResetResponse());
    }
}
