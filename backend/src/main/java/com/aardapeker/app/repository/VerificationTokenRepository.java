package com.aardapeker.app.repository;

import com.aardapeker.app.model.User;
import com.aardapeker.app.model.VerificationToken;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface VerificationTokenRepository
    extends JpaRepository<VerificationToken, UUID> {
    @Modifying
    @Query(
        """
            UPDATE VerificationToken t
            SET t.used = true
            WHERE t.user = :user AND t.used = false
        """
    )
    void invalidateAllByUser(@Param("user") User user);

    Optional<VerificationToken> findTopByUserAndUsedFalseOrderByExpiresAtDesc(
        User user
    );

    @Modifying
    @Query(
        """
            DELETE FROM VerificationToken t
            WHERE t.expiresAt < :now OR t.used = true
        """
    )
    int deleteAllExpired(@Param("now") LocalDateTime now);

    @Modifying
    @Query(
        """
            UPDATE VerificationToken t
            SET t.attempts = t.attempts + 1
            WHERE t.id = :id
        """
    )
    void incrementAttempts(@Param("id") UUID id);

    @Modifying
    @Query(
        """
            UPDATE VerificationToken t
            SET t.used = true
            WHERE t.id = :id AND t.attempts >= :maxAttempts
        """
    )
    void lockIfMaxAttemptsReached(
        @Param("id") UUID id,
        @Param("maxAttempts") int maxAttempts
    );

    @Query(
        """
            SELECT COUNT(t)
            FROM VerificationToken t
            WHERE t.user = :user
              AND t.createdAt > :since
        """
    )
    int countRecentTokens(
        @Param("user") User user,
        @Param("since") LocalDateTime since
    );
}
