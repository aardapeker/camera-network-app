package com.aardapeker.app.dto.request;

import com.aardapeker.app.model.Role;
import java.util.Set;

public record AddUserRequest(
    String firstName,
    String lastName,
    String username,
    String email,
    String password,
    String profilePictureUrl,
    Set<Role> authorities
) {
    public static AddUserRequestBuilder builder() {
        return new AddUserRequestBuilder();
    }

    public static class AddUserRequestBuilder {

        private String firstName;
        private String lastName;
        private String username;
        private String email;
        private String password;
        private String profilePictureUrl;
        private Set<Role> authorities;

        AddUserRequestBuilder() {}

        public AddUserRequestBuilder firstName(String firstName) {
            this.firstName = firstName;
            return this;
        }

        public AddUserRequestBuilder lastName(String lastName) {
            this.lastName = lastName;
            return this;
        }

        public AddUserRequestBuilder username(String username) {
            this.username = username;
            return this;
        }

        public AddUserRequestBuilder email(String email) {
            this.email = email;
            return this;
        }

        public AddUserRequestBuilder password(String password) {
            this.password = password;
            return this;
        }

        public AddUserRequestBuilder authorities(Set<Role> authorities) {
            this.authorities = authorities;
            return this;
        }

        public AddUserRequestBuilder profilePictureUrl(
            String profilePictureUrl
        ) {
            this.profilePictureUrl = profilePictureUrl;
            return this;
        }

        public AddUserRequest build() {
            return new AddUserRequest(
                firstName,
                lastName,
                username,
                email,
                password,
                profilePictureUrl,
                authorities
            );
        }
    }
}
