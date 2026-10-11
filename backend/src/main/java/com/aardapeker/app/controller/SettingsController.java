package com.aardapeker.app.controller;

import com.aardapeker.app.dto.request.UpdateSettingsRequest;
import com.aardapeker.app.dto.response.SettingsResponse;
import com.aardapeker.app.model.User;
import com.aardapeker.app.service.SettingsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("api/settings")
public class SettingsController {

    private final SettingsService settingsService;

    public SettingsController(SettingsService settingsService) {
        this.settingsService = settingsService;
    }

    @GetMapping("/me")
    public ResponseEntity<SettingsResponse> getMySettings(
        @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(settingsService.getSettings(user));
    }

    @PutMapping("/me")
    public ResponseEntity<SettingsResponse> updateMySettings(
        @AuthenticationPrincipal User user,
        @RequestBody UpdateSettingsRequest request
    ) {
        return ResponseEntity.ok(settingsService.updateSettings(user, request));
    }
}
