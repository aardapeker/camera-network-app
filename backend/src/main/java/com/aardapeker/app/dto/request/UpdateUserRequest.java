package com.aardapeker.app.dto.request;

//@Builder
public record UpdateUserRequest(
    String firstName,
    String lastName,
    String password
) {
    // static builder method
    public static UpdateUserRequestBuilder builder() {
        return new UpdateUserRequestBuilder();
    }

    // static inner builder class
    public static class UpdateUserRequestBuilder {

        private String firstName;
        private String lastName;
        private String password;

        UpdateUserRequestBuilder() {}

        public UpdateUserRequestBuilder firstName(String firstName) {
            this.firstName = firstName;
            return this;
        }

        public UpdateUserRequestBuilder lastName(String lastName) {
            this.lastName = lastName;
            return this;
        }

        public UpdateUserRequestBuilder password(String password) {
            this.password = password;
            return this;
        }

        public UpdateUserRequest build() {
            return new UpdateUserRequest(firstName, lastName, password);
        }
    }
}
