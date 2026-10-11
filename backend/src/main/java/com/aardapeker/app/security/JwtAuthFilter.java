package com.aardapeker.app.security;

import com.aardapeker.app.repository.TokenRepository;
import com.aardapeker.app.service.JwtService;
import com.aardapeker.app.service.TokenService;
import com.aardapeker.app.service.impl.UserDetailsServiceImpl;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsServiceImpl userDetailsServiceImpl;
    private final TokenRepository tokenRepository;
    private final TokenService tokenService;

    public JwtAuthFilter(
        JwtService jwtService,
        UserDetailsServiceImpl userDetailsServiceImpl,
        TokenRepository tokenRepository,
        TokenService tokenService
    ) {
        this.jwtService = jwtService;
        this.userDetailsServiceImpl = userDetailsServiceImpl;
        this.tokenRepository = tokenRepository;
        this.tokenService = tokenService;
    }

    @Override
    protected void doFilterInternal(
        @NonNull HttpServletRequest request,
        @NonNull HttpServletResponse response,
        @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");
        String token = null;
        String userName = null;

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
            userName = jwtService.extractUser(token);
        }

        if (
            userName != null &&
            SecurityContextHolder.getContext().getAuthentication() == null
        ) {
            UserDetails user = userDetailsServiceImpl.loadUserByUsername(
                userName
            );

            var isValidToken = tokenRepository
                .findByToken(token)
                .map(t -> !t.isExpired() && !t.isRevoked())
                .orElse(false);

            if (jwtService.validateToken(token, user) && isValidToken) {
                // ✅ Validate user account status
                validateUserStatus(user);
                UsernamePasswordAuthenticationToken authToken =
                    new UsernamePasswordAuthenticationToken(
                        user,
                        null,
                        user.getAuthorities()
                    );
                authToken.setDetails(
                    new WebAuthenticationDetailsSource().buildDetails(request)
                );
                SecurityContextHolder.getContext().setAuthentication(authToken);

                // ✅ ADD: Update activity tracking for authenticated requests
                tokenService.updateActivity(token);
            }
        }
        filterChain.doFilter(request, response);
    }

    // ✅ NEW METHOD: Validate user account status
    private void validateUserStatus(UserDetails user) {
        if (!user.isAccountNonLocked()) {
            throw new LockedException("User account is locked or banned");
        }

        if (!user.isEnabled()) {
            throw new DisabledException("User account is disabled");
        }

        if (!user.isAccountNonExpired()) {
            throw new DisabledException("User account has expired");
        }

        if (!user.isCredentialsNonExpired()) {
            throw new DisabledException("User credentials have expired");
        }
    }
}
