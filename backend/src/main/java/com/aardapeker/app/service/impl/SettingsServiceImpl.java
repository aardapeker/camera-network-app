package com.aardapeker.app.service.impl;

import com.aardapeker.app.dto.request.UpdateSettingsRequest;
import com.aardapeker.app.dto.response.SettingsResponse;
import com.aardapeker.app.model.Settings;
import com.aardapeker.app.model.User;
import com.aardapeker.app.repository.SettingsRepository;
import com.aardapeker.app.service.SettingsService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SettingsServiceImpl implements SettingsService {

    private final SettingsRepository settingsRepository;

    public SettingsServiceImpl(SettingsRepository settingsRepository) {
        this.settingsRepository = settingsRepository;
    }

    @SuppressWarnings("null")
    @Override
    @Transactional(readOnly = true)
    public SettingsResponse getSettings(User user) {
        Settings settings = settingsRepository.findByUser(user)
            .orElseGet(() -> Settings.builder().user(user).build());
        return toResponse(settings);
    }

    @SuppressWarnings("null")
    @Override
    @Transactional
    public SettingsResponse updateSettings(User user, UpdateSettingsRequest request) {
        Settings settings = settingsRepository.findByUser(user)
            .orElseGet(() -> Settings.builder().user(user).build());
        if (request.autoSaveEnabled() != null) settings.setAutoSaveEnabled(request.autoSaveEnabled());
        if (request.theme() != null) settings.setTheme(request.theme());
        if (request.language() != null) settings.setLanguage(request.language());
        if (request.cameraPrefix() != null) settings.setCameraPrefix(request.cameraPrefix());
        if (request.switchPrefix() != null) settings.setSwitchPrefix(request.switchPrefix());
        if (request.nvrPrefix() != null) settings.setNvrPrefix(request.nvrPrefix());
        if (request.routerPrefix() != null) settings.setRouterPrefix(request.routerPrefix());
        if (request.accessPointPrefix() != null) settings.setAccessPointPrefix(request.accessPointPrefix());
        if (request.upsPrefix() != null) settings.setUpsPrefix(request.upsPrefix());
        if (request.hornSpeakerPrefix() != null) settings.setHornSpeakerPrefix(request.hornSpeakerPrefix());
        settingsRepository.save(settings);
        return toResponse(settings);
    }

    private SettingsResponse toResponse(Settings settings) {
        return new SettingsResponse(
            settings.isAutoSaveEnabled(),
            settings.getTheme(),
            settings.getLanguage(),
            settings.getCameraPrefix(),
            settings.getSwitchPrefix(),
            settings.getNvrPrefix(),
            settings.getRouterPrefix(),
            settings.getAccessPointPrefix(),
            settings.getUpsPrefix(),
            settings.getHornSpeakerPrefix()
        );
    }
}
