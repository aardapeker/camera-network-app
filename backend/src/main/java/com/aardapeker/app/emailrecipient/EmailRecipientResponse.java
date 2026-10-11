package com.aardapeker.app.emailrecipient;

import java.time.LocalDateTime;
import java.util.UUID;

public record EmailRecipientResponse(
        UUID id,
        String email,
        String label,
        boolean active,
        LocalDateTime createdAt
) {
    public static EmailRecipientResponse from(EmailRecipient r) {
        return new EmailRecipientResponse(r.getId(), r.getEmail(), r.getLabel(), r.isActive(), r.getCreatedAt());
    }
}
