package com.aardapeker.app.validation;

import com.aardapeker.app.exception.BadRequestException;
import org.springframework.stereotype.Component;

@Component
public class UserValidator {

    private static final int MIN_DAYS = 1;
    private static final int MAX_DAYS = 365;
    private static final int MIN_MINUTES = 1;
    private static final int MAX_MINUTES = 1440;

    public void validateDaysParam(int days) {
        if (days < MIN_DAYS || days > MAX_DAYS) {
            throw new BadRequestException(
                "Days must be between " + MIN_DAYS + " and " + MAX_DAYS
            );
        }
    }

    public void validateMinutesParam(int minutes) {
        if (minutes < MIN_MINUTES || minutes > MAX_MINUTES) {
            throw new BadRequestException(
                "Minutes must be between " + MIN_MINUTES + " and " + MAX_MINUTES
            );
        }
    }

    public void validateAuthHeader(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new BadRequestException("Invalid authorization header");
        }
    }
}
