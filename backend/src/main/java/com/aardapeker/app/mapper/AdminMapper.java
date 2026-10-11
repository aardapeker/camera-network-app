package com.aardapeker.app.mapper;

import com.aardapeker.app.dto.response.CleanupTokensResponse;
import com.aardapeker.app.dto.response.IsAdminResponse;
import com.aardapeker.app.dto.response.RestrictedUserResponse;
import com.aardapeker.app.dto.response.TestResponse;
import com.aardapeker.app.dto.response.UserStatusChangeResponse;
import com.aardapeker.app.model.User;
import org.springframework.stereotype.Component;

@Component
public class AdminMapper {

    public RestrictedUserResponse toAddUserResponse(User user) {
        return RestrictedUserResponse.from(user, "User created successfully by admin");
    }

    public RestrictedUserResponse toUpdateUserResponse(User user) {
        return RestrictedUserResponse.from(user, "User updated successfully");
    }

    public UserStatusChangeResponse toStatusChangeResponse(User user) {
        return new UserStatusChangeResponse(
            "User status updated",
            user.getId(),
            user.getStatus()
        );
    }

    public CleanupTokensResponse toCleanupResponse(int deletedCount) {
        return new CleanupTokensResponse(
            "Token cleanup completed successfully",
            deletedCount
        );
    }

    public TestResponse toTestResponse() {
        return new TestResponse("This is ADMIN");
    }

    public IsAdminResponse toIsAdminResponse() {
        return new IsAdminResponse(true, "User has admin privileges");
    }
}
