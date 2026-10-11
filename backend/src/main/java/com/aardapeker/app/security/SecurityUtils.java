package com.aardapeker.app.security;

import com.aardapeker.app.exception.BadRequestException;
import com.aardapeker.app.model.User;

public class SecurityUtils {
  public static boolean hasRole(User user, String role) {
    return user.getAuthorities()
        .stream()
        .anyMatch(a -> a.getAuthority().equals(role));
  }

  public static String extractBearerToken(String authHeader) {
    if (authHeader == null || !authHeader.startsWith("Bearer ")) {
      throw new BadRequestException("Invalid authorization header format");
    }

    String token = authHeader.substring(7).trim();
    if (token.isEmpty()) {
      throw new BadRequestException("Token is empty");
    }

    return token;
  }
}
