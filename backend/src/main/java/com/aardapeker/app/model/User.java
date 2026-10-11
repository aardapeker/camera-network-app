package com.aardapeker.app.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import org.springframework.security.core.userdetails.UserDetails;

@Entity
@Table(name = "users")
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = true)
    private String firstName;

    @Column(nullable = true)
    private String lastName;

    @Column(unique = true)
    private String username;

    @Column(unique = true)
    private String email;

    // Make password nullable for OAuth users
    @Column(nullable = true)
    private String password;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // OAuth-specific fields
    @Column(name = "provider")
    private String provider; // "LOCAL", "GOOGLE", "GITHUB", etc.

    @Column(name = "provider_id")
    private String providerId; // OAuth provider's user ID

    @Column(name = "oauth_email_verified")
    private Boolean oauthEmailVerified; // OAuth email verification status

    // Boolean fields - source of truth for UserDetails
    private boolean accountNonExpired; // Account expiration
    private boolean isEnabled; // Email/Invitation verification status
    private boolean accountNonLocked; // Ban/Suspend status (false = banned)
    private boolean credentialsNonExpired; // Password expiration

    // Status field - computed from boolean fields
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private Status status;

    @ElementCollection(targetClass = Role.class, fetch = FetchType.EAGER)
    @JoinTable(name = "authorities", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "role", nullable = false)
    @Enumerated(EnumType.STRING)
    private Set<Role> authorities;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference("tokens")
    private Set<Token> tokens;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference("login_attempts")
    private Set<LoginAttempt> loginAttempts;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference("verification_tokens")
    private Set<VerificationToken> verificationTokens;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference("password_reset_tokens")
    private Set<PasswordResetToken> passwordResetTokens;

    @ManyToMany(mappedBy = "clients")
    @JsonIgnore
    private Set<Topology> topologies;

    @Column(name = "profile_picture_url", nullable = true)
    private String profilePictureUrl;

    // Method to sync status with boolean fields
    private void updateStatusFromFlags() {
        if (!isEnabled) {
            this.status = Status.PENDING;
        } else if (!accountNonLocked) {
            this.status = Status.BANNED;
        } else if (!accountNonExpired || !credentialsNonExpired) {
            this.status = Status.EXPIRED;
        } else {
            this.status = Status.ACTIVE;
        }
    }

    public boolean hasRole(Role role) {
        return authorities != null && authorities.contains(role);
    }

    // Helper method to check if user is OAuth user
    public boolean isOAuthUser() {
        return provider != null && !"LOCAL".equalsIgnoreCase(provider);
    }

    // Helper method to check if user can login with password
    public boolean canLoginWithPassword() {
        return password != null && !password.trim().isEmpty();
    }

    // No-arg constructor (required by JPA)
    public User() {
    }

    // All-args constructor (used by builder)
    public User(
            UUID id,
            String firstName,
            String lastName,
            String username,
            String email,
            String password,
            LocalDateTime createdAt,
            String provider,
            String providerId,
            Boolean oauthEmailVerified,
            boolean accountNonExpired,
            boolean isEnabled,
            boolean accountNonLocked,
            boolean credentialsNonExpired,
            Set<Role> authorities,
            Set<Token> tokens,
            String profilePictureUrl) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.username = username;
        this.email = email;
        this.password = password;
        this.createdAt = createdAt;
        this.provider = provider;
        this.providerId = providerId;
        this.oauthEmailVerified = oauthEmailVerified;
        this.accountNonExpired = accountNonExpired;
        this.isEnabled = isEnabled;
        this.accountNonLocked = accountNonLocked;
        this.credentialsNonExpired = credentialsNonExpired;
        this.authorities = authorities;
        this.tokens = tokens;
        this.profilePictureUrl = profilePictureUrl;

        // Initialize status based on boolean flags
        updateStatusFromFlags();
    }

    // Static builder method
    public static UserBuilder builder() {
        return new UserBuilder();
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    @Override
    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    @Override
    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public String getProviderId() {
        return providerId;
    }

    public void setProviderId(String providerId) {
        this.providerId = providerId;
    }

    public Boolean getOauthEmailVerified() {
        return oauthEmailVerified;
    }

    public void setOauthEmailVerified(Boolean oauthEmailVerified) {
        this.oauthEmailVerified = oauthEmailVerified;
    }

    @Override
    public boolean isAccountNonExpired() {
        return accountNonExpired;
    }

    public void setAccountNonExpired(boolean accountNonExpired) {
        this.accountNonExpired = accountNonExpired;
        updateStatusFromFlags();
    }

    @Override
    public boolean isEnabled() {
        return isEnabled;
    }

    public void setEnabled(boolean enabled) {
        isEnabled = enabled;
        updateStatusFromFlags();
    }

    @Override
    public boolean isAccountNonLocked() {
        return accountNonLocked;
    }

    public void setAccountNonLocked(boolean accountNonLocked) {
        this.accountNonLocked = accountNonLocked;
        updateStatusFromFlags();
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return credentialsNonExpired;
    }

    public void setCredentialsNonExpired(boolean credentialsNonExpired) {
        this.credentialsNonExpired = credentialsNonExpired;
        updateStatusFromFlags();
    }

    // Status getter (no setter - computed automatically)
    public Status getStatus() {
        return status;
    }

    @Override
    public Set<Role> getAuthorities() {
        return authorities;
    }

    public void setAuthorities(Set<Role> authorities) {
        this.authorities = authorities;
    }

    public Set<Token> getTokens() {
        return tokens;
    }

    public void setTokens(Set<Token> tokens) {
        this.tokens = tokens;
    }

    public String getProfilePictureUrl() {
        return profilePictureUrl;
    }

    public void setProfilePictureUrl(String profilePictureUrl) {
        this.profilePictureUrl = profilePictureUrl;
    }

    // Builder class
    public static class UserBuilder {

        private UUID id;
        private String firstName;
        private String lastName;
        private String username;
        private String email;
        private String password;
        private LocalDateTime createdAt;
        private String provider;
        private String providerId;
        private Boolean oauthEmailVerified;
        private boolean accountNonExpired;
        private boolean isEnabled;
        private boolean accountNonLocked;
        private boolean credentialsNonExpired;
        private Set<Role> authorities;
        private Set<Token> tokens;
        private String profilePictureUrl;

        UserBuilder() {
        }

        public UserBuilder id(UUID id) {
            this.id = id;
            return this;
        }

        public UserBuilder firstName(String firstName) {
            this.firstName = firstName;
            return this;
        }

        public UserBuilder lastName(String lastName) {
            this.lastName = lastName;
            return this;
        }

        public UserBuilder username(String username) {
            this.username = username;
            return this;
        }

        public UserBuilder email(String email) {
            this.email = email;
            return this;
        }

        public UserBuilder password(String password) {
            this.password = password;
            return this;
        }

        public UserBuilder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public UserBuilder provider(String provider) {
            this.provider = provider;
            return this;
        }

        public UserBuilder providerId(String providerId) {
            this.providerId = providerId;
            return this;
        }

        public UserBuilder oauthEmailVerified(Boolean oauthEmailVerified) {
            this.oauthEmailVerified = oauthEmailVerified;
            return this;
        }

        public UserBuilder accountNonExpired(boolean accountNonExpired) {
            this.accountNonExpired = accountNonExpired;
            return this;
        }

        public UserBuilder isEnabled(boolean isEnabled) {
            this.isEnabled = isEnabled;
            return this;
        }

        public UserBuilder accountNonLocked(boolean accountNonLocked) {
            this.accountNonLocked = accountNonLocked;
            return this;
        }

        public UserBuilder credentialsNonExpired(
                boolean credentialsNonExpired) {
            this.credentialsNonExpired = credentialsNonExpired;
            return this;
        }

        public UserBuilder authorities(Set<Role> authorities) {
            this.authorities = authorities;
            return this;
        }

        public UserBuilder tokens(Set<Token> tokens) {
            this.tokens = tokens;
            return this;
        }

        public UserBuilder profilePictureUrl(String profilePictureUrl) {
            this.profilePictureUrl = profilePictureUrl;
            return this;
        }

        public User build() {
            return new User(
                    id,
                    firstName,
                    lastName,
                    username,
                    email,
                    password,
                    createdAt,
                    provider,
                    providerId,
                    oauthEmailVerified,
                    accountNonExpired,
                    isEnabled,
                    accountNonLocked,
                    credentialsNonExpired,
                    authorities,
                    tokens,
                    profilePictureUrl);
        }
    }
}
