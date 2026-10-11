package com.aardapeker.app.mapper;

import com.aardapeker.app.dto.request.UpdateUserDetailsRequest;
import com.aardapeker.app.dto.response.ChangeDetailsResponse;
import com.aardapeker.app.dto.response.GetMeResponse;
import com.aardapeker.app.dto.response.UserResponse;
import com.aardapeker.app.model.CustomPermission;
import com.aardapeker.app.model.User;
import java.time.format.DateTimeFormatter;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    private static final DateTimeFormatter DATE_FORMATTER =
        DateTimeFormatter.ofPattern("EEEE, MMMM d, yyyy HH:mm");

    public UserResponse toResponse(User user) {
        if (user == null) {
            return null;
        }
        String formattedDate = user.getCreatedAt().format(DATE_FORMATTER);

        return new UserResponse(
            user.getId(),
            user.getUsername(),
            user.getFirstName(),
            user.getLastName(),
            user.getEmail(),
            user.getProfilePictureUrl(),
            user.getAuthorities(),
            user.getStatus(),
            formattedDate
        );
    }

    public GetMeResponse toGetMeResponse(User user, String ipAddress, boolean isAdmin, boolean isClient, String role, Set<CustomPermission> customPermissions) {
        return new GetMeResponse(
            user.getEmail(),
            user.getFirstName(),
            user.getLastName(),
            user.getUsername(),
            isAdmin,
            isClient,
            role,
            user.getProfilePictureUrl(),
            ipAddress,
            customPermissions
        );
    }

    public ChangeDetailsResponse toChangeDetailsResponse(User user) {
        return new ChangeDetailsResponse(
            user.getId(),
            user.getUsername(),
            user.getFirstName(),
            user.getLastName(),
            user.getEmail(),
            "Profile updated successfully."
        );
    }

    public void updateUserDetails(User user, UpdateUserDetailsRequest request) {
        if (request.firstName() != null && !request.firstName().isBlank()) {
            user.setFirstName(request.firstName());
        }
        if (request.lastName() != null && !request.lastName().isBlank()) {
            user.setLastName(request.lastName());
        }
    }
}
