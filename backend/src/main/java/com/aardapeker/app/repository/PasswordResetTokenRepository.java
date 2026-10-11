package com.aardapeker.app.repository;

import com.aardapeker.app.model.PasswordResetToken;
import com.aardapeker.app.model.User;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface PasswordResetTokenRepository
    extends JpaRepository<PasswordResetToken, UUID> {
    @Modifying
    @Query(
        """
            UPDATE PasswordResetToken t
            SET t.used = true
            WHERE t.user = :user AND t.used = false
        """
    )
    void invalidateAllByUser(@Param("user") User user);

    Optional<
        PasswordResetToken
    > findTopByUserEmailAndUsedFalseOrderByExpiresAtDesc(String email);

    @Modifying
    @Query(
        """
            DELETE FROM PasswordResetToken t
            WHERE t.expiresAt < :now OR t.used = true
        """
    )
    int deleteAllExpired(@Param("now") LocalDateTime now);
}
