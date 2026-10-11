package com.aardapeker.app.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "verification_tokens")
public class VerificationToken {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonBackReference("verification_tokens")
    private User user;

    private String hashedCode;

    private LocalDateTime createdAt;

    private LocalDateTime expiresAt;

    private int attempts;

    private boolean used;

    // No-args constructor
    public VerificationToken() {}

    // All-args constructor
    public VerificationToken(
        UUID id,
        User user,
        String hashedCode,
        LocalDateTime createdAt,
        LocalDateTime expiresAt,
        int attempts,
        boolean used
    ) {
        this.id = id;
        this.user = user;
        this.hashedCode = hashedCode;
        this.createdAt = createdAt;
        this.expiresAt = expiresAt;
        this.attempts = attempts;
        this.used = used;
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getHashedCode() {
        return hashedCode;
    }

    public void setHashedCode(String hashedCode) {
        this.hashedCode = hashedCode;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public int getAttempts() {
        return attempts;
    }

    public void setAttempts(int attempts) {
        this.attempts = attempts;
    }

    public boolean isUsed() {
        return used;
    }

    public void setUsed(boolean used) {
        this.used = used;
    }

    // Static builder method
    public static Builder builder() {
        return new Builder();
    }

    // Builder
    public static class Builder {

        private UUID id;
        private User user;
        private String hashedCode;
        private LocalDateTime createdAt;
        private LocalDateTime expiresAt;
        private int attempts;
        private boolean used;

        public Builder id(UUID id) {
            this.id = id;
            return this;
        }

        public Builder user(User user) {
            this.user = user;
            return this;
        }

        public Builder hashedCode(String hashedCode) {
            this.hashedCode = hashedCode;
            return this;
        }

        public Builder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public Builder expiresAt(LocalDateTime expiresAt) {
            this.expiresAt = expiresAt;
            return this;
        }

        public Builder attempts(int attempts) {
            this.attempts = attempts;
            return this;
        }

        public Builder used(boolean used) {
            this.used = used;
            return this;
        }

        public VerificationToken build() {
            VerificationToken token = new VerificationToken();
            token.setId(this.id);
            token.setUser(this.user);
            token.setHashedCode(this.hashedCode);
            token.setCreatedAt(this.createdAt);
            token.setExpiresAt(this.expiresAt);
            token.setAttempts(this.attempts);
            token.setUsed(this.used);
            return token;
        }
    }
}
