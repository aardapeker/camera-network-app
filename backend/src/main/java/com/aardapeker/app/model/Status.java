package com.aardapeker.app.model;

public enum Status {
    ACTIVE("Active"), // Fully active user
    PENDING("Pending"), // Email/verification pending
    BANNED("Banned"), // Account locked/banned
    EXPIRED("Expired"); // Account or credentials expired

    private final String value;

    Status(String value) {
        this.value = value;
    }

    public String getValue() {
        return this.value;
    }
}
