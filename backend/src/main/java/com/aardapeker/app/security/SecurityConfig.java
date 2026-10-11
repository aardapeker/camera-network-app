package com.aardapeker.app.security;

import com.aardapeker.app.model.Role;
import com.aardapeker.app.service.impl.UserDetailsServiceImpl;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpMethod;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.authentication.logout.LogoutHandler;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final ApiKeyAuthFilter apiKeyAuthFilter;
    private final UserDetailsServiceImpl userDetailsServiceImpl;
    private final PasswordEncoder passwordEncoder;
    private final CorsConfigurationSource corsConfigurationSource;
    private final LogoutHandler logoutHandler;

    public SecurityConfig(
            JwtAuthFilter jwtAuthFilter,
            ApiKeyAuthFilter apiKeyAuthFilter,
            UserDetailsServiceImpl userDetailsServiceImpl,
            PasswordEncoder passwordEncoder,
            CorsConfigurationSource corsConfigurationSource,
            LogoutHandler logoutHandler) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.apiKeyAuthFilter = apiKeyAuthFilter;
        this.userDetailsServiceImpl = userDetailsServiceImpl;
        this.passwordEncoder = passwordEncoder;
        this.corsConfigurationSource = corsConfigurationSource;
        this.logoutHandler = logoutHandler;
    }

    /**
     * Configures the security filter chain with role-based access control.
     * 
     * Security Model:
     * 1. Public endpoints: No authentication required (auth, file serving)
     * 2. Admin-only endpoints: Only ROLE_ADMIN can access /api/admin/**
     * 3. Client-accessible endpoints: All authenticated roles can access, but:
     *    - Clients (ROLE_CLIENT) can only access their own resources
     *    - Controller-level security enforces client isolation:
     *      * Clients can only access /api/topologies/client/{theirOwnUsername}
     *      * Clients can only save/update topologies for themselves
     *      * Admins/Developers/Managers/Tech can access all client resources for management
     * 4. All other endpoints: Require authentication
     * 
     * Note: Client resource isolation is enforced at the controller level in:
     * - TopologyController: Checks username matches for client users
     * - FileController: Validates client ownership
     * - UserController: Users can only access their own data
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity security)
            throws Exception {
        security
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                // Public endpoints - no authentication required
                .authorizeHttpRequests(x -> x
                        .requestMatchers(
                                "/auth/**",
                                "/files/serve/**")
                        .permitAll()) // permitAll should be first
                
                // Admin panel endpoints - accessible to ADMIN, DEVELOPER, MANAGER, and CUSTOM (with ACCESS_ADMIN_PANEL, enforced at controller level)
                .authorizeHttpRequests(x -> x
                        .requestMatchers("/api/admin/**")
                        .hasAnyRole(
                                Role.ROLE_ADMIN.getValue(),
                                Role.ROLE_DEVELOPER.getValue(),
                                Role.ROLE_MANAGER.getValue(),
                                Role.ROLE_CUSTOM.getValue())) // Admin endpoints must be checked before general authenticated endpoints

                // Actuator endpoints - restricted to ADMIN, DEVELOPER, MANAGER only
                // CUSTOM is excluded: AdminPanelAccessInterceptor doesn't cover /actuator/**, and raw JVM/system metrics are infrastructure-level access
                .authorizeHttpRequests(x -> x
                        .requestMatchers("/actuator/**")
                        .hasAnyRole(
                                Role.ROLE_ADMIN.getValue(),
                                Role.ROLE_DEVELOPER.getValue(),
                                Role.ROLE_MANAGER.getValue()))
                
                // Client-accessible endpoints - accessible to all authenticated roles
                // Note: Controller-level security ensures clients can only access their own resources
                // - Clients can only access their own topologies via /api/topologies/client/{theirUsername}
                // - Clients can only save/update topologies for themselves
                // - Admins, Developers, Managers, and Tech can access all client resources for management
                .authorizeHttpRequests(x -> x
                        .requestMatchers(
                                "/private/**",
                                "/users/**",
                                "/files/**",
                                "/api/topologies/**",
                                "/api/service-forms/**",
                                "/api/service-form-templates/**",
                                "/api/components/**",
                                "/api/customers/**",
                                "/api/audio/**")
                        .hasAnyRole(
                                Role.ROLE_ADMIN.getValue(),
                                Role.ROLE_DEVELOPER.getValue(),
                                Role.ROLE_MANAGER.getValue(),
                                Role.ROLE_MODERATOR.getValue(),
                                Role.ROLE_TECH.getValue(),
                                Role.ROLE_CLIENT.getValue(),
                                Role.ROLE_CUSTOM.getValue()))

                // Network scan ingestion (the Pi) - authenticated via ApiKeyAuthFilter
                // (static API key), not JWT. Kept out of permitAll() so a broken/missing
                // filter fails closed.
                .authorizeHttpRequests(x -> x
                        .requestMatchers(HttpMethod.POST, "/api/network-scans")
                        .authenticated())

                // Network scan browsing + agent settings (admin UI) - normal JWT + role
                // auth, same roles as the rest of the admin panel. Method-agnostic (covers
                // GET/PUT/etc.) - the more specific POST-exact-path matcher above is
                // evaluated first, so this doesn't affect the Pi's API-key-gated ingestion.
                .authorizeHttpRequests(x -> x
                        .requestMatchers("/api/network-scans/**")
                        .hasAnyRole(
                                Role.ROLE_ADMIN.getValue(),
                                Role.ROLE_DEVELOPER.getValue(),
                                Role.ROLE_MANAGER.getValue(),
                                Role.ROLE_CUSTOM.getValue()))

                // All other requests require authentication
                .authorizeHttpRequests(x -> x.anyRequest().authenticated()) // any request should be the last order
                .sessionManagement(x -> x.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // Add custom exception handlers for authentication/authorization failures
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint(
                                (request, response, authException) -> {
                                    response.setContentType("application/json");
                                    response.setStatus(
                                            HttpServletResponse.SC_UNAUTHORIZED);
                                    response
                                            .getWriter()
                                            .write(
                                                    "{\"error\":\"Unauthorized\",\"message\":\"Invalid or expired token\"}");
                                })
                        .accessDeniedHandler(
                                (request, response, accessDeniedException) -> {
                                    response.setContentType("application/json");
                                    response.setStatus(
                                            HttpServletResponse.SC_FORBIDDEN);
                                    response
                                            .getWriter()
                                            .write(
                                                    "{\"error\":\"Forbidden\",\"message\":\"You don't have permission to access this resource\"}");
                                }))
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(
                        apiKeyAuthFilter,
                        UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(
                        jwtAuthFilter,
                        UsernamePasswordAuthenticationFilter.class)
                .formLogin(AbstractHttpConfigurer::disable)
                .logout(x -> x.logoutUrl("/auth/logout"))
                .logout(x -> x.addLogoutHandler(logoutHandler))
                .logout(x -> x.logoutSuccessHandler(
                        ((request, response, authentication) -> SecurityContextHolder.clearContext())));
        return security.build();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authenticationProvider = new DaoAuthenticationProvider(userDetailsServiceImpl);
        authenticationProvider.setPasswordEncoder(passwordEncoder);
        return authenticationProvider;
    }

    // called in AuthController for check if user authenticated don't remove
    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }
}
