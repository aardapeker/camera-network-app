package com.aardapeker.app.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "login_attempts",
    indexes = {
        @Index(
            name = "idx_login_attempt_identifier",
            columnList = "identifier"
        ),
        @Index(
            name = "idx_login_attempt_attempted_at",
            columnList = "attemptedAt"
        ),
        @Index(name = "idx_login_attempt_ip", columnList = "ipAddress"),
    }
)
public class LoginAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = true)
    @JsonBackReference("login_attempts")
    private User user;

    private String identifier;

    @PrePersist
    @PreUpdate
    private void normalize() {
        if (identifier != null) {
            identifier = identifier.trim().toLowerCase();
        }
    }

    private boolean successful;

    @Column(length = 64)
    private String ipAddress;

    @Column(length = 512)
    private String userAgent;

    @Column(length = 64)
    private String deviceType; // "Mobile", "Tablet", "Desktop"

    @Column(length = 128)
    private String deviceModel; // "iPhone", "Samsung Galaxy S21", "Windows"

    @Column(length = 64)
    private String browser; // "Chrome", "Firefox", "Safari", etc.

    @Column(length = 64)
    private String os; // "Windows", "macOS", "Linux", "iOS", "Android", etc.

    @Column(length = 128)
    private String location; // City/Country from IP

    // TODO: ADD @CreationTimestamp WHEN PUSHED TO PRODUCTION
    // Removed @CreationTimestamp to allow manual setting
    private LocalDateTime attemptedAt;

    private String failureReason; // Invalid password, account locked, etc.

    // No-args constructor
    public LoginAttempt() {}

    // All-args constructor
    public LoginAttempt(
        UUID id,
        User user,
        String identifier,
        boolean successful,
        String ipAddress,
        String userAgent,
        String deviceType,
        String deviceModel,
        String browser,
        String os,
        String location,
        LocalDateTime attemptedAt,
        String failureReason
    ) {
        this.id = id;
        this.user = user;
        this.identifier = identifier;
        this.successful = successful;
        this.ipAddress = ipAddress;
        this.userAgent = userAgent;
        this.deviceType = deviceType;
        this.deviceModel = deviceModel;
        this.browser = browser;
        this.os = os;
        this.location = location;
        this.attemptedAt = attemptedAt;
        this.failureReason = failureReason;
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getIdentifier() {
        return identifier;
    }

    public void setIdentifier(String identifier) {
        this.identifier = identifier;
    }

    public boolean isSuccessful() {
        return successful;
    }

    public void setSuccessful(boolean successful) {
        this.successful = successful;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public void setUserAgent(String userAgent) {
        this.userAgent = userAgent;
    }

    public String getDeviceType() {
        return deviceType;
    }

    public void setDeviceType(String deviceType) {
        this.deviceType = deviceType;
    }

    public String getDeviceModel() {
        return deviceModel;
    }

    public void setDeviceModel(String deviceModel) {
        this.deviceModel = deviceModel;
    }

    public String getBrowser() {
        return browser;
    }

    public void setBrowser(String browser) {
        this.browser = browser;
    }

    public String getOs() {
        return os;
    }

    public void setOs(String os) {
        this.os = os;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public LocalDateTime getAttemptedAt() {
        return attemptedAt;
    }

    public void setAttemptedAt(LocalDateTime attemptedAt) {
        this.attemptedAt = attemptedAt;
    }

    public String getFailureReason() {
        return failureReason;
    }

    public void setFailureReason(String failureReason) {
        this.failureReason = failureReason;
    }

    // Static builder method
    public static LoginAttemptBuilder builder() {
        return new LoginAttemptBuilder();
    }

    // Builder class
    public static class LoginAttemptBuilder {

        private UUID id;
        private User user;
        private String identifier;
        private boolean successful;
        private String ipAddress;
        private String userAgent;
        private String deviceType;
        private String deviceModel;
        private String browser;
        private String os;
        private String location;
        private LocalDateTime attemptedAt;
        private String failureReason;

        LoginAttemptBuilder() {}

        public LoginAttemptBuilder id(UUID id) {
            this.id = id;
            return this;
        }

        public LoginAttemptBuilder user(User user) {
            this.user = user;
            return this;
        }

        public LoginAttemptBuilder identifier(String identifier) {
            this.identifier = identifier;
            return this;
        }

        public LoginAttemptBuilder successful(boolean successful) {
            this.successful = successful;
            return this;
        }

        public LoginAttemptBuilder ipAddress(String ipAddress) {
            this.ipAddress = ipAddress;
            return this;
        }

        public LoginAttemptBuilder userAgent(String userAgent) {
            this.userAgent = userAgent;
            return this;
        }

        public LoginAttemptBuilder deviceType(String deviceType) {
            this.deviceType = deviceType;
            return this;
        }

        public LoginAttemptBuilder deviceModel(String deviceModel) {
            this.deviceModel = deviceModel;
            return this;
        }

        public LoginAttemptBuilder browser(String browser) {
            this.browser = browser;
            return this;
        }

        public LoginAttemptBuilder os(String os) {
            this.os = os;
            return this;
        }

        public LoginAttemptBuilder location(String location) {
            this.location = location;
            return this;
        }

        public LoginAttemptBuilder attemptedAt(LocalDateTime attemptedAt) {
            this.attemptedAt = attemptedAt;
            return this;
        }

        public LoginAttemptBuilder failureReason(String failureReason) {
            this.failureReason = failureReason;
            return this;
        }

        public LoginAttempt build() {
            return new LoginAttempt(
                id,
                user,
                identifier,
                successful,
                ipAddress,
                userAgent,
                deviceType,
                deviceModel,
                browser,
                os,
                location,
                attemptedAt,
                failureReason
            );
        }
    }
}
