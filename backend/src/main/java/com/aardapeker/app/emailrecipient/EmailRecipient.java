package com.aardapeker.app.emailrecipient;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "email_recipients")
public class EmailRecipient {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String email;

    private String label;

    @Column(nullable = false)
    private boolean active = true;

    @CreationTimestamp
    private LocalDateTime createdAt;

    public EmailRecipient() {}

    public EmailRecipient(UUID id, String email, String label, boolean active, LocalDateTime createdAt) {
        this.id = id;
        this.email = email;
        this.label = label;
        this.active = active;
        this.createdAt = createdAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private UUID id;
        private String email, label;
        private boolean active = true;
        private LocalDateTime createdAt;

        public Builder id(UUID v) { this.id = v; return this; }
        public Builder email(String v) { this.email = v; return this; }
        public Builder label(String v) { this.label = v; return this; }
        public Builder active(boolean v) { this.active = v; return this; }
        public Builder createdAt(LocalDateTime v) { this.createdAt = v; return this; }

        public EmailRecipient build() {
            return new EmailRecipient(id, email, label, active, createdAt);
        }
    }
}
