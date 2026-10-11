package com.aardapeker.app.security;

import com.aardapeker.app.model.CustomPermission;
import com.aardapeker.app.model.Role;
import com.aardapeker.app.model.User;
import com.aardapeker.app.repository.UserPermissionRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;

/**
 * Intercepts /api/admin/** requests and rejects CUSTOM users that lack ACCESS_ADMIN_PANEL.
 * ADMIN/DEVELOPER/MANAGER pass through unconditionally (already filtered by SecurityConfig).
 */
@Component
public class AdminPanelAccessInterceptor implements HandlerInterceptor {

    private final UserPermissionRepository userPermissionRepository;

    public AdminPanelAccessInterceptor(UserPermissionRepository userPermissionRepository) {
        this.userPermissionRepository = userPermissionRepository;
    }

    @Override
    public boolean preHandle(@NonNull HttpServletRequest request,
                             @NonNull HttpServletResponse response,
                             @NonNull Object handler) throws IOException {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof User user)) {
            return true;
        }

        // Superior roles always allowed
        if (user.hasRole(Role.ROLE_ADMIN)
                || user.hasRole(Role.ROLE_DEVELOPER)
                || user.hasRole(Role.ROLE_MANAGER)) {
            return true;
        }

        // CUSTOM users need ACCESS_ADMIN_PANEL
        if (user.hasRole(Role.ROLE_CUSTOM)) {
            boolean hasAccess = userPermissionRepository.findByUser(user).stream()
                    .anyMatch(p -> p.getPermission() == CustomPermission.ACCESS_ADMIN_PANEL);
            if (hasAccess) return true;
        }

        response.setContentType("application/json");
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.getWriter().write("{\"error\":\"Forbidden\",\"message\":\"Admin panel access not granted\"}");
        return false;
    }
}
