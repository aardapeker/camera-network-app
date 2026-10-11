package com.aardapeker.app.model;

import com.fasterxml.jackson.annotation.JsonValue;
import org.springframework.security.core.GrantedAuthority;

// Make refactoring if it can be done better
public enum Role implements GrantedAuthority {
    ROLE_ADMIN("ADMIN"),
    ROLE_DEVELOPER("DEVELOPER"),
    ROLE_MANAGER("MANAGER"),
    ROLE_MODERATOR("MODERATOR"),
    ROLE_TECH("TECH"),
    ROLE_CLIENT("CLIENT"),
    ROLE_CUSTOM("CUSTOM");

    private final String value;

    Role(String value) {
        this.value = value;
    }

    public String getValue() {
        return this.value;
    }

    @JsonValue
    @Override
    public String getAuthority() {
        return name();
    }
}
