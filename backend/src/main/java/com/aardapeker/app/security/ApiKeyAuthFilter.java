package com.aardapeker.app.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Authenticates the network-scan Raspberry Pi via a static API key header,
 * scoped to POST /api/network-scans only (the ingestion endpoint the Pi
 * calls). GET requests under /api/network-scans/** (used by logged-in admins
 * browsing the results in the UI) are left untouched here and authenticated
 * normally via JwtAuthFilter + role checks in SecurityConfig instead.
 */
@Component
public class ApiKeyAuthFilter extends OncePerRequestFilter {

    private static final String INGEST_PATH = "/api/network-scans";
    private static final String API_KEY_HEADER = "X-API-Key";

    private final String configuredApiKey;

    public ApiKeyAuthFilter(@Value("${scan.api-key:}") String configuredApiKey) {
        this.configuredApiKey = configuredApiKey;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        boolean isIngestRequest = "POST".equalsIgnoreCase(request.getMethod())
                && INGEST_PATH.equals(request.getRequestURI());
        if (!isIngestRequest) {
            filterChain.doFilter(request, response);
            return;
        }

        String providedKey = request.getHeader(API_KEY_HEADER);
        if (!isValidKey(providedKey)) {
            response.setContentType("application/json");
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write(
                    "{\"error\":\"Unauthorized\",\"message\":\"Missing or invalid API key\"}");
            return;
        }

        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                "pi-scanner", null, List.of(new SimpleGrantedAuthority("ROLE_SCANNER")));
        SecurityContextHolder.getContext().setAuthentication(authToken);

        filterChain.doFilter(request, response);
    }

    private boolean isValidKey(String providedKey) {
        if (providedKey == null || configuredApiKey.isEmpty()) {
            return false;
        }
        byte[] provided = providedKey.getBytes(StandardCharsets.UTF_8);
        byte[] configured = configuredApiKey.getBytes(StandardCharsets.UTF_8);
        return provided.length == configured.length && MessageDigest.isEqual(provided, configured);
    }
}
