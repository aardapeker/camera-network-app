package com.aardapeker.app.policy;

import com.aardapeker.app.exception.ForbiddenActionException;
import com.aardapeker.app.model.User;
import org.springframework.stereotype.Component;

@Component
public class FilePolicy {

    public void validateUserCanAccessFile(User user, String fileName) {
        String expectedPrefix = "users/" + user.getUsername() + "/";
        if (!fileName.startsWith(expectedPrefix)) {
            throw new ForbiddenActionException("Not authorized to access this file");
        }
    }

    public void validateUserCanDeleteFile(User user, String fileName) {
        validateUserCanAccessFile(user, fileName);
    }

    public void validateUserCanListFiles(User user) {
        if (!user.isEnabled()) {
            throw new ForbiddenActionException("Account not enabled");
        }
    }
}
