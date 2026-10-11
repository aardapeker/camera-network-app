package com.aardapeker.app.service;

import com.aardapeker.app.dto.response.SettingsResponse;
import com.aardapeker.app.dto.request.UpdateSettingsRequest;
import com.aardapeker.app.model.User;

public interface SettingsService {
    SettingsResponse getSettings(User user);
    SettingsResponse updateSettings(User user, UpdateSettingsRequest request);
}
