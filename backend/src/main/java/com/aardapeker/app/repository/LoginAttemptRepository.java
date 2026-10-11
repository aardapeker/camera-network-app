package com.aardapeker.app.repository;

import com.aardapeker.app.model.LoginAttempt;
import com.aardapeker.app.model.User;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface LoginAttemptRepository
    extends JpaRepository<LoginAttempt, UUID> {
    long count();

    long countBySuccessful(boolean successful);

    // Find all attempts by user (using in UserService.deleteLoginAttemptsByUsername)
    List<LoginAttempt> findByUserOrderByAttemptedAtDesc(User user);

    // Find all attempts by user with pagination
    Page<LoginAttempt> findByUserOrderByAttemptedAtDesc(
        User user,
        Pageable pageable
    );

    // Find all successful or failed attempts by user with pagination
    Page<LoginAttempt> findByUserAndSuccessfulOrderByAttemptedAtDesc(
        User user,
        boolean successful,
        Pageable pageable
    );

    // Find recent attempts by user (for dashboard)
    @Query(
        "SELECT la FROM LoginAttempt la WHERE la.user = :user AND la.attemptedAt >= :since ORDER BY la.attemptedAt DESC"
    )
    List<LoginAttempt> findRecentAttemptsByUser(
        @Param("user") User user,
        @Param("since") LocalDateTime since
    );

    // Count failed attempts by identifier in time window
    @Query(
        "SELECT COUNT(la) FROM LoginAttempt la WHERE la.identifier = :identifier AND la.successful = false AND la.attemptedAt >= :since"
    )
    long countFailedAttemptsByIdentifierSince(
        @Param("identifier") String identifier,
        @Param("since") LocalDateTime since
    );

    // ========== ADMIN METHODS ==========

    // Find all login attempts with pagination (for admin)
    Page<LoginAttempt> findAllByOrderByAttemptedAtDesc(Pageable pageable);

    // Find login attempts by identifier with pagination
    Page<LoginAttempt> findByIdentifierContainingOrderByAttemptedAtDesc(
        String identifier,
        Pageable pageable
    );

    // Find failed login attempts with pagination
    Page<LoginAttempt> findBySuccessfulOrderByAttemptedAtDesc(
        boolean successful,
        Pageable pageable
    );

    // Find login attempts by IP address
    Page<LoginAttempt> findByIpAddressOrderByAttemptedAtDesc(
        String ipAddress,
        Pageable pageable
    );
}
