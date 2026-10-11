package com.aardapeker.app.model;

import jakarta.persistence.*;
import java.util.UUID;

/**
 * Stores per-user permission overrides for ROLE_CUSTOM users.
 * Each row represents one granted permission for one user.
 */
@Entity
@Table(name = "user_permissions",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "permission"}))
public class UserPermission {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "permission", nullable = false)
    private CustomPermission permission;

    public UserPermission() {}

    public UserPermission(User user, CustomPermission permission) {
        this.user = user;
        this.permission = permission;
    }

    public UUID getId() { return id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public CustomPermission getPermission() { return permission; }
    public void setPermission(CustomPermission permission) { this.permission = permission; }
}
