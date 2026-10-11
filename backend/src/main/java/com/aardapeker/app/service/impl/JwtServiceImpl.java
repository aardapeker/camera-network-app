package com.aardapeker.app.service.impl;

import com.aardapeker.app.model.Token;
import com.aardapeker.app.model.TokenType;
import com.aardapeker.app.model.User;
import com.aardapeker.app.repository.TokenRepository;
import com.aardapeker.app.service.GeolocationService;
import com.aardapeker.app.service.JwtService;
import com.aardapeker.app.util.HttpRequestHelper;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.http.HttpServletRequest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class JwtServiceImpl implements JwtService {

    private final String secretKey;
    private final TokenRepository tokenRepository;
    private final GeolocationService geolocationService;

    public JwtServiceImpl(
        TokenRepository tokenRepository,
        GeolocationService geolocationService,
        @Value("${jwt.secret:}") String jwtSecret
    ) {
        this.tokenRepository = tokenRepository;
        this.geolocationService = geolocationService;
        // Use the configured secret if provided, otherwise generate one for this run
        this.secretKey = (jwtSecret != null && !jwtSecret.isBlank())
            ? jwtSecret
            : generateSecretKey();
    }

    @Override
    public String generateSecretKey() {
        try {
            KeyGenerator keyGenerator = KeyGenerator.getInstance("HmacSHA256");
            SecretKey secretKey = keyGenerator.generateKey();

            return Base64.getEncoder().encodeToString(secretKey.getEncoded());
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Error generating secret key");
        }
    }

    @Override
    @Transactional
    public String generateToken(User user, HttpServletRequest request) {
        Map<String, Object> claims = new HashMap<>();
        String jwt = createToken(claims, user.getUsername());

        if (request != null) {
            String userAgent = HttpRequestHelper.getUserAgent(request);
            String deviceType = HttpRequestHelper.getDeviceType(userAgent);
            String browser = HttpRequestHelper.getBrowser(userAgent);
            String os = HttpRequestHelper.getOperatingSystem(userAgent);

            tokenRepository.revokeSameDeviceTokens(
                user,
                deviceType,
                browser,
                os
            );

            saveUserToken(user, jwt, request);
        }

        return jwt;
    }

    private void saveUserToken(
        User user,
        String jwtToken,
        HttpServletRequest request
    ) {
        Token.TokenBuilder tokenBuilder = Token.builder()
            .user(user)
            .token(jwtToken)
            .tokenType(TokenType.BEARER)
            .expired(false)
            .revoked(false)
            .lastUsedAt(LocalDateTime.now())
            .sessionStartedAt(LocalDateTime.now());

        if (request != null) {
            String ipAddress = HttpRequestHelper.getClientIpAddress(request);
            String userAgent = HttpRequestHelper.getUserAgent(request);
            String deviceType = HttpRequestHelper.getDeviceType(userAgent);
            String deviceModel = HttpRequestHelper.getDeviceModel(userAgent);
            String browser = HttpRequestHelper.getBrowser(userAgent);
            String os = HttpRequestHelper.getOperatingSystem(userAgent);
            String location = geolocationService.getFormattedLocation(
                ipAddress
            );

            tokenBuilder
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .deviceType(deviceType)
                .deviceModel(deviceModel)
                .browser(browser)
                .operatingSystem(os)
                .location(location);
        }

        Token token = tokenBuilder.build();
        tokenRepository.save(token);
    }

    @Override
    public Boolean validateToken(String token, UserDetails userDetails) {
        String username = extractUser(token);
        Date expirationDate = extractExpiration(token);
        return (
            userDetails.getUsername().equals(username) &&
            expirationDate.after(new Date())
        );
    }

    @Override
    public String extractUser(String token) {
        Claims claims = Jwts.parser()
            .verifyWith(getSignKey())
            .build()
            .parseSignedClaims(token)
            .getPayload();
        return claims.getSubject();
    }

    private Date extractExpiration(String token) {
        Claims claims = Jwts.parser()
            .verifyWith(getSignKey())
            .build()
            .parseSignedClaims(token)
            .getPayload();
        return claims.getExpiration();
    }

    private String createToken(Map<String, Object> claims, String userName) {
        return Jwts.builder()
            .claims(claims)
            .subject(userName)
            .issuedAt(new Date(System.currentTimeMillis()))
            .expiration(
                new Date(System.currentTimeMillis() + 15 * 24 * 60 * 60 * 1000)
            )
            .signWith(getSignKey())
            .compact();
    }

    private SecretKey getSignKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
