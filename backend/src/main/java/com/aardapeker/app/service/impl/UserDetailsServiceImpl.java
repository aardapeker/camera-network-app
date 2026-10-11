package com.aardapeker.app.service.impl;

import com.aardapeker.app.model.User;
import com.aardapeker.app.service.UserService;
import java.util.Optional;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserService userService;

    public UserDetailsServiceImpl(UserService userService) {
        this.userService = userService;
    }

    @Override
    public UserDetails loadUserByUsername(String identifier)
        throws UsernameNotFoundException {
        Optional<User> user = userService.findByUsernameOrEmail(identifier);
        return user.orElseThrow(() ->
            new UsernameNotFoundException(
                "User not found with identifier: " + identifier
            )
        );
    }
}
