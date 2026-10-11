package com.aardapeker.app.validation;

import com.aardapeker.app.dto.request.AddUserRequest;
import com.aardapeker.app.dto.request.UpdateUserStatusRequest;
import com.aardapeker.app.exception.BadRequestException;
import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;

@Component
public class AdminValidator {

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@(.+)$");
    private static final int MIN_PASSWORD_LENGTH = 6;
    private static final int MIN_CLEANUP_DAYS = 1;

    public void validateForAddUser(AddUserRequest request) {
        if (request.username() == null || request.username().isBlank()) {
            throw new BadRequestException("Username is required");
        }
        if (request.email() == null || request.email().isBlank()) {
            throw new BadRequestException("Email is required");
        }
        if (!EMAIL_PATTERN.matcher(request.email()).matches()) {
            throw new BadRequestException("Valid email is required");
        }
        if (request.password() == null || request.password().length() < MIN_PASSWORD_LENGTH) {
            throw new BadRequestException(
                "Password must be at least " + MIN_PASSWORD_LENGTH + " characters"
            );
        }
        if (request.authorities() == null || request.authorities().isEmpty()) {
            throw new BadRequestException("At least one role is required");
        }
    }

    public void validateForUpdateStatus(UpdateUserStatusRequest request) {
        if (request.status() == null) {
            throw new BadRequestException("Status is required");
        }
    }

    public void validateForBatchDelete(List<UUID> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            throw new BadRequestException("At least one user ID is required");
        }
    }

    public int validateAndNormalizeCleanupDays(Integer days) {
        if (days == null || days < MIN_CLEANUP_DAYS) {
            return MIN_CLEANUP_DAYS;
        }
        return days;
    }
}
