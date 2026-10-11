package com.aardapeker.app.dto.response;

public record SettingsResponse(
    boolean autoSaveEnabled,
    String theme,
    String language,
    String cameraPrefix,
    String switchPrefix,
    String nvrPrefix,
    String routerPrefix,
    String accessPointPrefix,
    String upsPrefix,
    String hornSpeakerPrefix
) {}
