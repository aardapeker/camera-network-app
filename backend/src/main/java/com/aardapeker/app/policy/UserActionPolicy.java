package com.aardapeker.app.policy;

import com.aardapeker.app.exception.ForbiddenActionException;
import com.aardapeker.app.model.User;
import org.springframework.stereotype.Component;

@Component
public class UserActionPolicy {

    public void validateUserIsOperational(User user) {
        if (!user.isEnabled()) {
            throw new ForbiddenActionException(
                "Action not allowed: user not enabled"
            );
        }

        if (!user.isAccountNonLocked()) {
            throw new ForbiddenActionException(
                "Action not allowed: user locked"
            );
        }

        if (!user.isAccountNonExpired()) {
            throw new ForbiddenActionException(
                "Action not allowed: account expired"
            );
        }

        if (!user.isCredentialsNonExpired()) {
            throw new ForbiddenActionException(
                "Action not allowed: credentials expired"
            );
        }
    }
}
