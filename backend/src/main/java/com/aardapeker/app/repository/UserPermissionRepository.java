package com.aardapeker.app.repository;

import com.aardapeker.app.model.CustomPermission;
import com.aardapeker.app.model.User;
import com.aardapeker.app.model.UserPermission;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface UserPermissionRepository extends JpaRepository<UserPermission, UUID> {

    List<UserPermission> findByUser(User user);

    @Modifying
    @Query("DELETE FROM UserPermission p WHERE p.user = :user")
    void deleteByUser(@Param("user") User user);

    boolean existsByUserAndPermission(User user, CustomPermission permission);
}
