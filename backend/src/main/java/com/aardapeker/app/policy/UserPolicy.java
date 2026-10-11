package com.aardapeker.app.policy;

import com.aardapeker.app.exception.BadRequestException;
import com.aardapeker.app.exception.ForbiddenActionException;
import com.aardapeker.app.model.Role;
import com.aardapeker.app.model.User;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class UserPolicy {

    public void validateUserCanDeleteSelf(User user) {
        boolean isRegularUser = user
            .getAuthorities()
            .stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_CLIENT"));

        if (!isRegularUser) {
            throw new ForbiddenActionException(
                "Only client users can delete their accounts"
            );
        }
    }

    public void validateUserDeletable(User user) {
        if (user.getAuthorities().contains(Role.ROLE_ADMIN)) {
            throw new ForbiddenActionException("Cannot delete admin users");
        }
    }

    public void validatePasswordMatch(
        String rawPassword,
        String encodedPassword,
        BCryptPasswordEncoder encoder
    ) {
        if (!encoder.matches(rawPassword, encodedPassword)) {
            throw new BadRequestException("Current password is incorrect");
        }
    }
}
