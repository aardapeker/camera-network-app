package com.aardapeker.app.dto.request;

public record UpdateSettingsRequest(
    Boolean autoSaveEnabled,
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
