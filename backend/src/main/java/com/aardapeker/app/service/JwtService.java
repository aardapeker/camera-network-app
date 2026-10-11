package com.aardapeker.app.service;

import com.aardapeker.app.model.User;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.core.userdetails.UserDetails;

public interface JwtService {

    String generateSecretKey();

    String generateToken(User user, HttpServletRequest request);

    Boolean validateToken(String token, UserDetails userDetails);

    String extractUser(String token);
}
