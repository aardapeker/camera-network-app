package com.aardapeker.app.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;

@Entity
public class Token {

    @Id
    @GeneratedValue
    public UUID id;

    @Column(unique = true)
    public String token;

    @Enumerated(EnumType.STRING)
    public TokenType tokenType = TokenType.BEARER;

    public boolean revoked;
    public boolean expired;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "last_used_at")
    private LocalDateTime lastUsedAt;

    @Column(name = "session_started_at")
    private LocalDateTime sessionStartedAt;

    // Log out or ending session (it set the 30 minutes later user close the browser even if user is not logged out)
    @Column(name = "session_ended_at")
    private LocalDateTime sessionEndedAt;

    @Column(name = "session_duration_seconds")
    private Long sessionDurationSeconds;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "user_agent")
    private String userAgent;

    @Column(name = "device_type")
    private String deviceType;

    @Column(name = "device_model")
    private String deviceModel;

    @Column(name = "browser")
    private String browser;

    @Column(name = "operating_system")
    private String operatingSystem;

    @Column(name = "location")
    private String location;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @JsonBackReference("tokens")
    public User user;

    @Transient
    public boolean isActive() {
        return !revoked && !expired && sessionEndedAt == null;
    }

    public void endSession() {
        if (sessionEndedAt == null) {
            // Only end if not already ended
            this.sessionEndedAt = LocalDateTime.now();

            // Calculate current session duration from when it started
            LocalDateTime sessionStart = sessionStartedAt != null
                ? sessionStartedAt
                : createdAt; // Fallback to token creation for first session

            if (sessionStart != null && sessionEndedAt != null) {
                Duration currentDuration = Duration.between(
                    sessionStart,
                    sessionEndedAt
                );
                long currentSeconds = currentDuration.getSeconds();

                // Add to accumulated total (or initialize if null)
                if (this.sessionDurationSeconds == null) {
                    this.sessionDurationSeconds = currentSeconds;
                } else {
                    this.sessionDurationSeconds += currentSeconds;
                }
            }
        }
    }

    // all args constructor
    public Token(
        UUID id,
        String token,
        TokenType tokenType,
        boolean revoked,
        boolean expired,
        LocalDateTime createdAt,
        LocalDateTime sessionStartedAt,
        LocalDateTime lastUsedAt,
        LocalDateTime sessionEndedAt,
        Long sessionDurationSeconds,
        String ipAddress,
        String userAgent,
        String deviceType,
        String deviceModel,
        String browser,
        String operatingSystem,
        String location,
        User user
    ) {
        this.id = id;
        this.token = token;
        this.tokenType = tokenType;
        this.revoked = revoked;
        this.expired = expired;
        this.createdAt = createdAt;
        this.sessionStartedAt = sessionStartedAt;
        this.lastUsedAt = lastUsedAt;
        this.sessionEndedAt = sessionEndedAt;
        this.sessionDurationSeconds = sessionDurationSeconds;
        this.ipAddress = ipAddress;
        this.userAgent = userAgent;
        this.deviceType = deviceType;
        this.deviceModel = deviceModel;
        this.browser = browser;
        this.operatingSystem = operatingSystem;
        this.location = location;
        this.user = user;
    }

    // no args constructor
    public Token() {}

    // getters and setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public TokenType getTokenType() {
        return tokenType;
    }

    public void setTokenType(TokenType tokenType) {
        this.tokenType = tokenType;
    }

    public boolean isRevoked() {
        return revoked;
    }

    public void setRevoked(boolean revoked) {
        this.revoked = revoked;
        // When token is revoked, end the session
        if (revoked && sessionEndedAt == null) {
            endSession();
        }
    }

    public boolean isExpired() {
        return expired;
    }

    public void setExpired(boolean expired) {
        this.expired = expired;
        // When token expires, end the session
        if (expired && sessionEndedAt == null) {
            endSession();
        }
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getSessionStartedAt() {
        return sessionStartedAt;
    }

    public void setSessionStartedAt(LocalDateTime sessionStartedAt) {
        this.sessionStartedAt = sessionStartedAt;
    }

    public LocalDateTime getLastUsedAt() {
        return lastUsedAt;
    }

    public void setLastUsedAt(LocalDateTime lastUsedAt) {
        this.lastUsedAt = lastUsedAt;
    }

    public LocalDateTime getSessionEndedAt() {
        return sessionEndedAt;
    }

    public void setSessionEndedAt(LocalDateTime sessionEndedAt) {
        this.sessionEndedAt = sessionEndedAt;
    }

    public Long getSessionDurationSeconds() {
        return sessionDurationSeconds;
    }

    public void setSessionDurationSeconds(Long sessionDurationSeconds) {
        this.sessionDurationSeconds = sessionDurationSeconds;
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

    public String getOperatingSystem() {
        return operatingSystem;
    }

    public void setOperatingSystem(String operatingSystem) {
        this.operatingSystem = operatingSystem;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    // static builder method
    public static TokenBuilder builder() {
        return new TokenBuilder();
    }

    // builder class
    public static class TokenBuilder {

        private UUID id;
        private String token;
        private TokenType tokenType = TokenType.BEARER;
        private boolean revoked;
        private boolean expired;
        private LocalDateTime createdAt;
        private LocalDateTime sessionStartedAt;
        private LocalDateTime lastUsedAt;
        private LocalDateTime sessionEndedAt;
        private Long sessionDurationSeconds;
        private String ipAddress;
        private String userAgent;
        private String deviceType;
        private String deviceModel;
        private String browser;
        private String operatingSystem;
        private String location;
        private User user;

        TokenBuilder() {}

        public TokenBuilder id(UUID id) {
            this.id = id;
            return this;
        }

        public TokenBuilder token(String token) {
            this.token = token;
            return this;
        }

        public TokenBuilder tokenType(TokenType tokenType) {
            this.tokenType = tokenType;
            return this;
        }

        public TokenBuilder revoked(boolean revoked) {
            this.revoked = revoked;
            return this;
        }

        public TokenBuilder expired(boolean expired) {
            this.expired = expired;
            return this;
        }

        public TokenBuilder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public TokenBuilder sessionStartedAt(LocalDateTime sessionStartedAt) {
            this.sessionStartedAt = sessionStartedAt;
            return this;
        }

        public TokenBuilder lastUsedAt(LocalDateTime lastUsedAt) {
            this.lastUsedAt = lastUsedAt;
            return this;
        }

        public TokenBuilder sessionEndedAt(LocalDateTime sessionEndedAt) {
            this.sessionEndedAt = sessionEndedAt;
            return this;
        }

        public TokenBuilder sessionDurationSeconds(
            Long sessionDurationSeconds
        ) {
            this.sessionDurationSeconds = sessionDurationSeconds;
            return this;
        }

        public TokenBuilder ipAddress(String ipAddress) {
            this.ipAddress = ipAddress;
            return this;
        }

        public TokenBuilder userAgent(String userAgent) {
            this.userAgent = userAgent;
            return this;
        }

        public TokenBuilder deviceType(String deviceType) {
            this.deviceType = deviceType;
            return this;
        }

        public TokenBuilder deviceModel(String deviceModel) {
            this.deviceModel = deviceModel;
            return this;
        }

        public TokenBuilder browser(String browser) {
            this.browser = browser;
            return this;
        }

        public TokenBuilder operatingSystem(String operatingSystem) {
            this.operatingSystem = operatingSystem;
            return this;
        }

        public TokenBuilder location(String location) {
            this.location = location;
            return this;
        }

        public TokenBuilder user(User user) {
            this.user = user;
            return this;
        }

        public Token build() {
            return new Token(
                id,
                token,
                tokenType,
                revoked,
                expired,
                createdAt,
                sessionStartedAt,
                lastUsedAt,
                sessionEndedAt,
                sessionDurationSeconds,
                ipAddress,
                userAgent,
                deviceType,
                deviceModel,
                browser,
                operatingSystem,
                location,
                user
            );
        }
    }
}
