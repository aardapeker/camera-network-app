package com.aardapeker.app.repository;

import com.aardapeker.app.model.Token;
import com.aardapeker.app.model.User;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TokenRepository extends JpaRepository<Token, UUID> {
    @Query(
        value = "SELECT t.* FROM token t WHERE t.user_id = :userId",
        nativeQuery = true
    )
    List<Token> findAllTokensByUserId(@Param("userId") UUID userId);

    // ============================================
    // TOKEN VALIDATION QUERIES
    // ============================================

    /**
     * Find all valid (non-expired AND non-revoked) tokens for a user
     * FIXED: Changed OR to AND logic
     */
    @Query(
        "SELECT t FROM Token t WHERE t.user.id = :userId AND t.expired = false AND t.revoked = false"
    )
    List<Token> findAllValidTokenByUser(@Param("userId") UUID userId);

    /**
     * Find token by JWT string
     */
    Optional<Token> findByToken(String token);

    // ============================================
    // SESSION TRACKING QUERIES
    // ============================================

    /**
     * Find the current active session for a user
     * Active = not revoked, not expired, and not logged out
     * Returns the most recent one if multiple exist
     */
    @Query(
        "SELECT t FROM Token t WHERE t.user.id = :userId AND t.expired = false AND t.revoked = false AND t.sessionEndedAt IS NULL ORDER BY t.createdAt DESC"
    )
    Optional<Token> findActiveTokenByUserId(@Param("userId") UUID userId);

    /**
     * Find all tokens for a user ordered by creation date (most recent first)
     * Useful for session history
     */
    @Query(
        "SELECT t FROM Token t WHERE t.user.id = :userId ORDER BY t.createdAt DESC"
    )
    List<Token> findAllTokensByUserIdOrdered(@Param("userId") UUID userId);

    /**
     * Find stale active sessions (inactive for too long)
     * Used by scheduled task to auto-logout inactive users
     */
    @Query(
        "SELECT t FROM Token t WHERE t.expired = false AND t.revoked = false AND t.sessionEndedAt IS NULL AND t.lastUsedAt < :threshold"
    )
    List<Token> findStaleActiveSessions(
        @Param("threshold") LocalDateTime threshold
    );

    @Query(
        """
            SELECT t FROM Token t
            WHERE t.user.id = :userId
              AND t.createdAt >= :startDate
            ORDER BY t.createdAt DESC
        """
    )
    List<Token> findUserTokensSince(
        @Param("userId") UUID userId,
        @Param("startDate") LocalDateTime startDate
    );

    // ============================================
    // ANALYTICS QUERIES
    // ============================================

    /**
     * Get most active users leaderboard based on total session time
     */
    @Query(
        """
            SELECT t.user.id as userId,
                   t.user.username as username,
                   t.user.email as email,
                   t.user.firstName as firstName,
                   t.user.lastName as lastName,
                   t.user.profilePictureUrl as profilePictureUrl,
                   COUNT(t) as totalSessions,
                   COALESCE(SUM(t.sessionDurationSeconds), 0) as totalTimeSeconds,
                   COALESCE(AVG(t.sessionDurationSeconds), 0) as averageSessionDurationSeconds,
                   MAX(t.createdAt) as lastLoginTime,
                   MAX(t.lastUsedAt) as lastActivityTime,
                   SUM(CASE WHEN t.expired = false AND t.revoked = false AND t.sessionEndedAt IS NULL THEN 1 ELSE 0 END) as activeSessions
            FROM Token t
            WHERE t.createdAt >= :startDate
            GROUP BY t.user.id, t.user.username, t.user.email, t.user.firstName, t.user.lastName, t.user.profilePictureUrl
            ORDER BY totalTimeSeconds DESC
        """
    )
    Page<Object[]> findMostActiveUsers(
        @Param("startDate") LocalDateTime startDate,
        Pageable pageable
    );

    /**
     * Get total active time (in seconds) for a specific user
     */
    @Query(
        "SELECT COALESCE(SUM(t.sessionDurationSeconds), 0) FROM Token t WHERE t.user.id = :userId"
    )
    Long getTotalActiveTimeByUserId(@Param("userId") UUID userId);

    /**
     * Count total sessions for a user within a date range
     */
    @Query(
        "SELECT COUNT(t) FROM Token t WHERE t.user.id = :userId AND t.createdAt >= :startDate"
    )
    Long countSessionsByUserIdSince(
        @Param("userId") UUID userId,
        @Param("startDate") LocalDateTime startDate
    );

    @Modifying
    @Query(
        """
            UPDATE Token t
            SET t.revoked = true,
            t.expired = true,
            t.sessionEndedAt = CURRENT_TIMESTAMP
            WHERE t.user = :user
              AND t.revoked = false
              AND t.expired = false
              AND t.deviceType = :deviceType
              AND t.browser = :browser
              AND t.operatingSystem = :os
        """
    )
    void revokeSameDeviceTokens(
        @Param("user") User user,
        @Param("deviceType") String deviceType,
        @Param("browser") String browser,
        @Param("os") String operatingSystem
    );

    // ============================================
    // CLEANUP QUERIES
    // ============================================

    /**
     * Delete old revoked/expired tokens (cleanup task)
     * Keeps database size manageable
     */
    @Modifying
    @Query(
        """
            DELETE FROM Token t
            WHERE (t.revoked = true OR t.expired = true)
              AND t.createdAt < :cutoff
        """
    )
    int deleteOldRevokedTokens(@Param("cutoff") LocalDateTime cutoff); // ← Spring returns the JDBC row count

    // Option 1: int - returns affected row count
    // Option 2: Integer - returns affected row count (nullable)
    // Option 3: void - ignores the count

    /**
     * Delete all revoked/expired tokens immediately
     * Use with caution - for maintenance only
     */
    @Modifying
    @Query(
        value = "DELETE FROM token WHERE (revoked = true OR expired = true)",
        nativeQuery = true
    )
    int deleteAllRevokedTokens(); // ← Spring returns the JDBC row count
}
