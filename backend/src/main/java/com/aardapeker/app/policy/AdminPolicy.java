package com.aardapeker.app.policy;

import com.aardapeker.app.exception.BadRequestException;
import com.aardapeker.app.exception.ForbiddenActionException;
import com.aardapeker.app.model.Role;
import com.aardapeker.app.model.Status;
import com.aardapeker.app.model.User;
import com.aardapeker.app.repository.UserRepository;
import org.springframework.stereotype.Component;

@Component
public class AdminPolicy {

    private final UserRepository userRepository;

    public AdminPolicy(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public void validateUserNotAdmin(User user) {
        if (user.getAuthorities().contains(Role.ROLE_ADMIN)) {
            throw new ForbiddenActionException("Cannot perform this operation on admin users. Admin users cannot be banned or deleted.");
        }
    }

    public void validateStatusTransition(User user, Status targetStatus) {
        validateUserNotAdmin(user);

        if (user.getStatus() == targetStatus) {
            throw new BadRequestException("User is already in status: " + targetStatus);
        }
    }

    public void validateUsernameNotTaken(String username) {
        if (userRepository.existsByUsername(username)) {
            throw new BadRequestException("Username already exists: " + username);
        }
    }

    public void validateEmailNotTaken(String email) {
        if (userRepository.existsByEmail(email)) {
            throw new BadRequestException("Email already exists: " + email);
        }
    }

    public void validateUserCanBeDeleted(User user) {
        validateUserNotAdmin(user);
    }
}
