package com.aardapeker.app.service.impl;

import com.aardapeker.app.dto.VerifyResult;
import com.aardapeker.app.dto.request.AuthRequest;
import com.aardapeker.app.dto.request.RegisterUserRequest;
import com.aardapeker.app.dto.request.ResetPasswordRequest;
import com.aardapeker.app.dto.request.VerifyUserRequest;
import com.aardapeker.app.dto.response.AuthResponse;
import com.aardapeker.app.exception.BadRequestException;
import com.aardapeker.app.exception.EmailSendException;
import com.aardapeker.app.exception.TooManyLoginAttemptsException;
import com.aardapeker.app.exception.UserNotFoundException;
import com.aardapeker.app.model.PasswordResetToken;
import com.aardapeker.app.model.Role;
import com.aardapeker.app.model.User;
import com.aardapeker.app.model.VerificationToken;
import com.aardapeker.app.policy.PasswordResetPolicy;
import com.aardapeker.app.policy.ResendPolicy;
import com.aardapeker.app.policy.UserActionPolicy;
import com.aardapeker.app.policy.VerificationPolicy;
import com.aardapeker.app.repository.PasswordResetTokenRepository;
import com.aardapeker.app.repository.UserRepository;
import com.aardapeker.app.repository.VerificationTokenRepository;
import com.aardapeker.app.service.AuthService;
import com.aardapeker.app.service.EmailService;
import com.aardapeker.app.service.JwtService;
import com.aardapeker.app.service.LoginAttemptAuditService;
import com.aardapeker.app.templates.EmailLayout;
import com.aardapeker.app.templates.ResetPasswordEmailTemplate;
import com.aardapeker.app.templates.VerificationEmailTemplate;
import jakarta.mail.MessagingException;
import jakarta.servlet.http.HttpServletRequest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Set;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final UserActionPolicy userActionPolicy;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordResetPolicy passwordResetPolicy;
    private final VerificationPolicy verificationPolicy;
    private final VerificationTokenRepository verificationTokenRepository;
    private final ResendPolicy resendPolicy;
    private final LoginAttemptAuditService loginAttemptAuditService;

    public AuthServiceImpl(
        UserRepository userRepository,
        BCryptPasswordEncoder passwordEncoder,
        EmailService emailService,
        JwtService jwtService,
        AuthenticationManager authenticationManager,
        UserActionPolicy userActionPolicy,
        PasswordResetTokenRepository passwordResetTokenRepository,
        PasswordResetPolicy passwordResetPolicy,
        VerificationPolicy verificationPolicy,
        VerificationTokenRepository verificationTokenRepository,
        ResendPolicy resendPolicy,
        LoginAttemptAuditService loginAttemptAuditService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.userActionPolicy = userActionPolicy;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordResetPolicy = passwordResetPolicy;
        this.verificationPolicy = verificationPolicy;
        this.verificationTokenRepository = verificationTokenRepository;
        this.resendPolicy = resendPolicy;
        this.loginAttemptAuditService = loginAttemptAuditService;
    }

    @Value("${frontend.base-url}")
    private String frontendBaseUrl;

    private static final Logger log = LoggerFactory.getLogger(AuthServiceImpl.class);
    private static final SecureRandom secureRandom = new SecureRandom();

    @Override
    @Transactional(readOnly = true)
    public User findByIdentifier(String identifier) throws UsernameNotFoundException {
        return userRepository
            .findByUsername(identifier)
            .or(() -> userRepository.findByEmail(identifier))
            .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }

    @Override
    @Transactional
    public User createUser(RegisterUserRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new BadRequestException("An account with this email already exists");
        }

        if (userRepository.existsByUsername(request.username())) {
            throw new BadRequestException("This username is already taken");
        }

        String rawCode = generateVerificationCode();
        String hashedCode = passwordEncoder.encode(rawCode);

        User newUser = User.builder()
            .firstName(request.firstName())
            .lastName(request.lastName())
            .username(request.username())
            .email(request.email())
            .password(passwordEncoder.encode(request.password()))
            .profilePictureUrl(request.profilePictureUrl())
            .authorities(Set.of(Role.ROLE_CLIENT))
            .accountNonExpired(true)
            .credentialsNonExpired(true)
            .isEnabled(false)
            .accountNonLocked(true)
            .build();

        User savedUser = userRepository.save(newUser);

        VerificationToken token = VerificationToken.builder()
            .user(savedUser)
            .hashedCode(hashedCode)
            .expiresAt(LocalDateTime.now().plusMinutes(10))
            .attempts(0)
            .used(false)
            .build();

        verificationTokenRepository.save(token);

        sendVerificationEmail(savedUser, rawCode);

        return savedUser;
    }

    @Override
    @Transactional
    public User verifyUser(VerifyUserRequest input) {
        User user = userRepository
            .findByEmail(input.email())
            .orElseThrow(() -> new UserNotFoundException("User not found"));

        VerificationToken token = verificationTokenRepository
            .findTopByUserAndUsedFalseOrderByExpiresAtDesc(user)
            .orElseThrow(() ->
                new BadRequestException("Invalid or expired verification token")
            );

        verificationPolicy.validateCode(token, input.verificationCode(), passwordEncoder);

        verificationTokenRepository.invalidateAllByUser(user);

        user.setEnabled(true);

        return userRepository.save(user);
    }

    @Override
    @Transactional
    public VerifyResult verifyUserAndGenerateToken(
        VerifyUserRequest input,
        HttpServletRequest request
    ) {
        User user = verifyUser(input);
        String token = jwtService.generateToken(user, request);
        return VerifyResult.of(user, token);
    }

    @Override
    @Transactional
    public void resendVerificationCode(String email) {
        User user = userRepository
            .findByEmail(email)
            .orElseThrow(() -> new UserNotFoundException("User not found"));

        resendPolicy.validateUserCanResendVerification(user);

        verificationTokenRepository.invalidateAllByUser(user);

        String rawCode = generateVerificationCode();
        String hashedCode = passwordEncoder.encode(rawCode);

        VerificationToken token = VerificationToken.builder()
            .user(user)
            .hashedCode(hashedCode)
            .createdAt(LocalDateTime.now())
            .expiresAt(LocalDateTime.now().plusMinutes(10))
            .attempts(0)
            .used(false)
            .build();

        verificationTokenRepository.save(token);

        sendVerificationEmail(user, rawCode);
    }

    @Override
    @Async
    public void sendVerificationEmail(User user, String rawCode) {
        String subject = "Account Verification";
        String html = EmailLayout.render(
            "Verify your email",
            VerificationEmailTemplate.content(rawCode)
        );

        try {
            emailService.sendVerificationEmail(user.getEmail(), subject, html);
        } catch (MessagingException e) {
            log.warn(
                "Verification email could not be sent to {}. User will need to resend.",
                user.getEmail(),
                e
            );
        }
    }

    @Override
    @Transactional
    @Async
    public void sendResetPasswordLink(String email) {
        userRepository
            .findByEmail(email)
            .ifPresent(user -> {
                userActionPolicy.validateUserIsOperational(user);

                passwordResetTokenRepository.invalidateAllByUser(user);

                String rawToken = generateResetPasswordToken();
                String hashedToken = passwordEncoder.encode(rawToken);

                PasswordResetToken token = new PasswordResetToken();
                token.setUser(user);
                token.setHashedToken(hashedToken);
                token.setExpiresAt(LocalDateTime.now().plusMinutes(30));
                token.setUsed(false);

                passwordResetTokenRepository.save(token);

                String subject = "Password Reset";
                String resetLink = frontendBaseUrl +
                    "/reset-password?token=" + rawToken +
                    "&email=" + email;

                String html = EmailLayout.render(
                    "Reset your password",
                    ResetPasswordEmailTemplate.content(resetLink)
                );

                try {
                    emailService.sendVerificationEmail(email, subject, html);
                } catch (MessagingException e) {
                    log.error("Failed to send reset password email to {}", email, e);
                    throw new EmailSendException("Failed to send reset password email");
                }
            });
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetToken token = passwordResetTokenRepository
            .findTopByUserEmailAndUsedFalseOrderByExpiresAtDesc(request.email())
            .orElseThrow(() ->
                new BadRequestException("Invalid or expired reset token")
            );

        passwordResetPolicy.validateToken(token);
        passwordResetPolicy.validateTokenMatches(
            request.token(),
            token.getHashedToken(),
            passwordEncoder
        );

        User user = token.getUser();

        userActionPolicy.validateUserIsOperational(user);

        user.setPassword(passwordEncoder.encode(request.password()));
        token.setUsed(true);

        userRepository.save(user);
        passwordResetTokenRepository.save(token);
    }

    @Override
    public String generateResetPasswordToken() {
        try {
            KeyGenerator keyGenerator = KeyGenerator.getInstance("HmacSHA256");
            SecretKey secretKey = keyGenerator.generateKey();

            return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(secretKey.getEncoded());
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Error generating secret key");
        }
    }

    @Override
    @Transactional
    public AuthResponse login(AuthRequest request, HttpServletRequest httpRequest) {
        String identifier = request.identifier().trim().toLowerCase();

        if (loginAttemptAuditService.isUnderBruteForceAttack(identifier, 5, 15)) {
            throw new TooManyLoginAttemptsException();
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(identifier, request.password())
            );

            User user = (User) authentication.getPrincipal();

            userActionPolicy.validateUserIsOperational(user);

            String token = jwtService.generateToken(user, httpRequest);

            loginAttemptAuditService.logSuccessfulLogin(identifier, httpRequest);

            return new AuthResponse(token, "Authentication successful", user.getUsername());
        } catch (AuthenticationException e) {
            String failureReason = parseFailureReason(e);
            loginAttemptAuditService.logFailedLogin(identifier, failureReason, httpRequest);
            throw e;
        } catch (Exception e) {
            loginAttemptAuditService.logFailedLogin(identifier, "SYSTEM_ERROR", httpRequest);
            throw e;
        }
    }

    private String generateVerificationCode() {
        int code = secureRandom.nextInt(1_000_000);
        return String.format("%06d", code);
    }

    private String parseFailureReason(Exception e) {
        if (e.getMessage() == null) {
            return "AUTHENTICATION_FAILED";
        }

        String message = e.getMessage().toLowerCase();

        if (message.contains("bad credentials")) {
            return "INVALID_PASSWORD";
        } else if (message.contains("disabled")) {
            return "ACCOUNT_DISABLED";
        } else if (message.contains("locked")) {
            return "ACCOUNT_LOCKED";
        } else if (message.contains("expired")) {
            return "ACCOUNT_EXPIRED";
        }

        return "AUTHENTICATION_FAILED";
    }
}
