package com.aardapeker.app.service.impl;

import com.aardapeker.app.dto.UserActivityStats;
import com.aardapeker.app.dto.request.MostActiveUsersRequest;
import com.aardapeker.app.dto.request.UserStatsRequest;
import com.aardapeker.app.dto.response.PageResponse;
import com.aardapeker.app.model.Token;
import com.aardapeker.app.model.User;
import com.aardapeker.app.repository.TokenRepository;
import com.aardapeker.app.service.TokenService;
import com.aardapeker.app.mapper.UserActivityStatsMapper;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TokenServiceImpl implements TokenService {

    private final TokenRepository tokenRepository;

    private static final int SESSION_TIMEOUT_MINUTES = 30;

    public TokenServiceImpl(TokenRepository tokenRepository) {
        this.tokenRepository = tokenRepository;
    }

    @Override
    @Transactional
    public boolean revokeToken(String tokenString) {
        Optional<Token> tokenOptional = tokenRepository.findByToken(tokenString);

        if (tokenOptional.isEmpty()) {
            return false;
        }

        Token token = tokenOptional.get();

        if (token.isRevoked() && token.isExpired()) {
            return false;
        }

        token.setRevoked(true);
        token.setExpired(true);
        tokenRepository.save(token);

        return true;
    }

    @Override
    @Transactional
    public int revokeAllUserTokens(UUID userId) {
        List<Token> userTokens = tokenRepository.findAllTokensByUserId(userId);

        if (userTokens.isEmpty()) {
            return 0;
        }

        int activeTokenCount = (int) userTokens
            .stream()
            .filter(token -> !token.isRevoked() && !token.isExpired())
            .count();

        userTokens.forEach(token -> {
            token.setRevoked(true);
            token.setExpired(true);
        });

        tokenRepository.saveAll(userTokens);

        return activeTokenCount;
    }

    @Override
    @Transactional
    public int cleanupRevokedTokens(Duration olderThan) {
        LocalDateTime cutoff = LocalDateTime.now().minus(olderThan);
        return tokenRepository.deleteOldRevokedTokens(cutoff);
    }

    @Override
    @Transactional
    public int cleanupAllRevokedTokens() {
        return tokenRepository.deleteAllRevokedTokens();
    }

    @Override
    @Transactional
    public void updateActivity(String tokenString) {
        Token token = tokenRepository
            .findByToken(tokenString)
            .orElseThrow(() -> new IllegalArgumentException("Token not found"));

        if (
            token.getSessionEndedAt() != null &&
            !token.isRevoked() &&
            !token.isExpired()
        ) {
            LocalDateTime now = LocalDateTime.now();
            token.setSessionEndedAt(null);
            token.setSessionStartedAt(now);
            token.setLastUsedAt(now);
            tokenRepository.save(token);
            return;
        }

        if (token.isActive()) {
            token.setLastUsedAt(LocalDateTime.now());
            tokenRepository.save(token);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Object[]> getMostActiveUsers(LocalDateTime startDate, Pageable pageable) {
        return tokenRepository.findMostActiveUsers(startDate, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public UserActivityStats getUserActivityStats(User user, LocalDateTime startDate) {
        List<Token> tokens = tokenRepository
            .findAllTokensByUserIdOrdered(user.getId())
            .stream()
            .filter(t -> t.getCreatedAt().isAfter(startDate))
            .toList();

        Long totalSessions = (long) tokens.size();
        Long totalTimeSeconds = tokens
            .stream()
            .mapToLong(t ->
                t.getSessionDurationSeconds() != null
                    ? t.getSessionDurationSeconds()
                    : 0L
            )
            .sum();
        Double avgDuration = tokens.isEmpty()
            ? 0.0
            : (double) totalTimeSeconds / tokens.size();
        LocalDateTime lastLogin = tokens.isEmpty()
            ? null
            : tokens.get(0).getCreatedAt();
        LocalDateTime lastActivity = tokens.isEmpty()
            ? null
            : tokens.get(0).getLastUsedAt();
        Long activeSessions = tokens.stream().filter(Token::isActive).count();

        return new UserActivityStats(
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            user.getFirstName(),
            user.getLastName(),
            user.getProfilePictureUrl(),
            totalSessions,
            totalTimeSeconds,
            avgDuration,
            lastLogin,
            lastActivity,
            activeSessions
        );
    }

    @Override
    @Transactional(readOnly = true)
    public UserActivityStats getUserActivityStatsByUserId(UserStatsRequest request) {
        LocalDateTime startDate = LocalDateTime.now().minusDays(request.days());

        List<Token> tokens = tokenRepository.findUserTokensSince(
            request.userId(),
            startDate
        );

        if (tokens.isEmpty()) {
            return UserActivityStats.empty(request.userId());
        }

        Token latestToken = tokens.get(0);
        User user = latestToken.getUser();

        long totalSessions = tokens.size();

        long totalTimeSeconds = tokens
            .stream()
            .mapToLong(t ->
                t.getSessionDurationSeconds() != null
                    ? t.getSessionDurationSeconds()
                    : 0L
            )
            .sum();

        double avgDuration = totalSessions == 0
            ? 0
            : (double) totalTimeSeconds / totalSessions;

        long activeSessions = tokens.stream().filter(Token::isActive).count();

        return new UserActivityStats(
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            user.getFirstName(),
            user.getLastName(),
            user.getProfilePictureUrl(),
            totalSessions,
            totalTimeSeconds,
            avgDuration,
            latestToken.getCreatedAt(),
            latestToken.getLastUsedAt(),
            activeSessions
        );
    }

    @Override
    @Transactional
    @Scheduled(fixedRate = 900000)
    public void closeInactiveSessions() {
        LocalDateTime threshold = LocalDateTime.now().minusMinutes(SESSION_TIMEOUT_MINUTES);
        List<Token> staleSessions = tokenRepository.findStaleActiveSessions(threshold);

        staleSessions.forEach(Token::endSession);

        if (!staleSessions.isEmpty()) {
            tokenRepository.saveAll(staleSessions);
            System.out.println("Closed " + staleSessions.size() + " stale sessions");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<UserActivityStats> mostActiveUsers(MostActiveUsersRequest request) {
        LocalDateTime startDate = LocalDateTime.now().minusDays(request.days());
        Pageable pageable = PageRequest.of(request.page(), request.size());
        Page<Object[]> results = getMostActiveUsers(startDate, pageable);

        return PageResponse.of(results.map(UserActivityStatsMapper::fromRow));
    }
}
