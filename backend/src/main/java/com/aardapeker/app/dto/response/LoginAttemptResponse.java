// Not using (AdminLoginAttemptResponse)
package com.aardapeker.app.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

public class LoginAttemptResponse {

    private UUID id;
    private String identifier;
    private boolean successful;
    private String ipAddress;
    private String deviceType;
    private String deviceModel;
    private String browser;
    private String os;
    private String location;
    private LocalDateTime attemptedAt;
    private String failureReason;

    // Constructor
    public LoginAttemptResponse(
        UUID id,
        String identifier,
        boolean successful,
        String ipAddress,
        String deviceType,
        String deviceModel,
        String browser,
        String os,
        String location,
        LocalDateTime attemptedAt,
        String failureReason
    ) {
        this.id = id;
        this.identifier = identifier;
        this.successful = successful;
        this.ipAddress = ipAddress;
        this.deviceType = deviceType;
        this.deviceModel = deviceModel;
        this.browser = browser;
        this.os = os;
        this.location = location;
        this.attemptedAt = attemptedAt;
        this.failureReason = failureReason;
    }

    // Getters (setters optional since we're using constructor)
    public UUID getId() {
        return id;
    }

    public String getIdentifier() {
        return identifier;
    }

    public boolean isSuccessful() {
        return successful;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public String getDeviceType() {
        return deviceType;
    }

    public String getDeviceModel() {
        return deviceModel;
    }

    public String getBrowser() {
        return browser;
    }

    public String getOs() {
        return os;
    }

    public String getLocation() {
        return location;
    }

    public LocalDateTime getAttemptedAt() {
        return attemptedAt;
    }

    public String getFailureReason() {
        return failureReason;
    }
}
