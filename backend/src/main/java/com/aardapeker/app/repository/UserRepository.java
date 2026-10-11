package com.aardapeker.app.repository;

import com.aardapeker.app.model.Role;
import com.aardapeker.app.model.User;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository
    extends JpaRepository<User, UUID>, JpaSpecificationExecutor<User> {
    List<User> findByAuthoritiesContaining(Role role);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    Optional<User> findByUsername(String userName);

    Optional<User> findByEmail(String email);

    // TODO: If there is possibility, use orphan removal instead of native queries
    //////////////// when user is deleted, authorities should be deleted as
    /// well //////////////
    @Modifying
    @Query(
        value = "DELETE FROM authorities WHERE user_id = (SELECT id FROM users WHERE username = :username)",
        nativeQuery = true
    )
    void deleteAuthoritiesByUsername(@Param("username") String username);

    // Delete tokens associated with the user
    @Modifying
    @Query(
        value = "DELETE FROM token WHERE user_id = (SELECT id FROM users WHERE username = :username)",
        nativeQuery = true
    )
    void deleteTokensByUsername(@Param("username") String username);

    @Modifying
    @Query(
        value = "DELETE FROM users WHERE username = :username",
        nativeQuery = true
    )
    void deleteUserByUsername(@Param("username") String username);

    // redundant
    @Modifying
    @Query(
        value = "UPDATE users SET profile_picture_url = :profilePictureUrl WHERE username = :username",
        nativeQuery = true
    )
    void updateProfilePictureUrl(
        @Param("username") String username,
        @Param("profilePictureUrl") String profilePictureUrl
    );
}
