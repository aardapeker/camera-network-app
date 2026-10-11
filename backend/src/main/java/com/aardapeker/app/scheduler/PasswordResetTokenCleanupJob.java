package com.aardapeker.app.scheduler;

import com.aardapeker.app.repository.PasswordResetTokenRepository;
import java.time.LocalDateTime;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class PasswordResetTokenCleanupJob {

    private final PasswordResetTokenRepository passwordResetTokenRepository;

    public PasswordResetTokenCleanupJob(
        PasswordResetTokenRepository passwordResetTokenRepository
    ) {
        this.passwordResetTokenRepository = passwordResetTokenRepository;
    }

    private static final Logger log = LoggerFactory.getLogger(
        PasswordResetTokenCleanupJob.class
    );

    @Scheduled(cron = "0 0 3 * * *") // Daily at 03:00
    @Transactional
    public void cleanupExpiredTokens() {
        int deleted = passwordResetTokenRepository.deleteAllExpired(
            LocalDateTime.now()
        );

        if (deleted > 0) {
            log.info("Deleted {} expired password reset tokens", deleted);
        }
    }
}
