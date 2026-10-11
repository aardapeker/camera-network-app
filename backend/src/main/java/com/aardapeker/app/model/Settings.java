package com.aardapeker.app.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "settings")
public class Settings {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    @JsonBackReference("user_settings")
    private User user;

    @Column(nullable = false)
    private boolean autoSaveEnabled = false;

    @Column(length = 16, nullable = false)
    private String theme = "system";

    @Column(length = 8, nullable = false)
    private String language = "en";

    // Default device name prefixes, applied to every new project (overridable per project)
    @Column(name = "camera_prefix", nullable = false)
    private String cameraPrefix = "Camera";

    @Column(name = "switch_prefix", nullable = false)
    private String switchPrefix = "Switch";

    @Column(name = "nvr_prefix", nullable = false)
    private String nvrPrefix = "NVR";

    @Column(name = "router_prefix", nullable = false)
    private String routerPrefix = "Router";

    @Column(name = "access_point_prefix", nullable = false)
    private String accessPointPrefix = "Access Point";

    @Column(name = "ups_prefix", nullable = false)
    private String upsPrefix = "UPS";

    @Column(name = "horn_speaker_prefix", nullable = false)
    private String hornSpeakerPrefix = "Horn Speaker";

    public Settings() {}

    public Settings(
        UUID id,
        User user,
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
    ) {
        this.id = id;
        this.user = user;
        this.autoSaveEnabled = autoSaveEnabled;
        this.theme = theme;
        this.language = language;
        this.cameraPrefix = cameraPrefix;
        this.switchPrefix = switchPrefix;
        this.nvrPrefix = nvrPrefix;
        this.routerPrefix = routerPrefix;
        this.accessPointPrefix = accessPointPrefix;
        this.upsPrefix = upsPrefix;
        this.hornSpeakerPrefix = hornSpeakerPrefix;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public boolean isAutoSaveEnabled() { return autoSaveEnabled; }
    public void setAutoSaveEnabled(boolean autoSaveEnabled) { this.autoSaveEnabled = autoSaveEnabled; }

    public String getTheme() { return theme; }
    public void setTheme(String theme) { this.theme = theme; }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    public String getCameraPrefix() { return cameraPrefix; }
    public void setCameraPrefix(String cameraPrefix) { this.cameraPrefix = cameraPrefix; }

    public String getSwitchPrefix() { return switchPrefix; }
    public void setSwitchPrefix(String switchPrefix) { this.switchPrefix = switchPrefix; }

    public String getNvrPrefix() { return nvrPrefix; }
    public void setNvrPrefix(String nvrPrefix) { this.nvrPrefix = nvrPrefix; }

    public String getRouterPrefix() { return routerPrefix; }
    public void setRouterPrefix(String routerPrefix) { this.routerPrefix = routerPrefix; }

    public String getAccessPointPrefix() { return accessPointPrefix; }
    public void setAccessPointPrefix(String accessPointPrefix) { this.accessPointPrefix = accessPointPrefix; }

    public String getUpsPrefix() { return upsPrefix; }
    public void setUpsPrefix(String upsPrefix) { this.upsPrefix = upsPrefix; }

    public String getHornSpeakerPrefix() { return hornSpeakerPrefix; }
    public void setHornSpeakerPrefix(String hornSpeakerPrefix) { this.hornSpeakerPrefix = hornSpeakerPrefix; }

    public static SettingsBuilder builder() { return new SettingsBuilder(); }

    public static class SettingsBuilder {
        private UUID id;
        private User user;
        private boolean autoSaveEnabled = false;
        private String theme = "system";
        private String language = "en";
        private String cameraPrefix = "Camera";
        private String switchPrefix = "Switch";
        private String nvrPrefix = "NVR";
        private String routerPrefix = "Router";
        private String accessPointPrefix = "Access Point";
        private String upsPrefix = "UPS";
        private String hornSpeakerPrefix = "Horn Speaker";

        SettingsBuilder() {}

        public SettingsBuilder id(UUID id) { this.id = id; return this; }
        public SettingsBuilder user(User user) { this.user = user; return this; }
        public SettingsBuilder autoSaveEnabled(boolean autoSaveEnabled) { this.autoSaveEnabled = autoSaveEnabled; return this; }
        public SettingsBuilder theme(String theme) { this.theme = theme; return this; }
        public SettingsBuilder language(String language) { this.language = language; return this; }
        public SettingsBuilder cameraPrefix(String cameraPrefix) { this.cameraPrefix = cameraPrefix; return this; }
        public SettingsBuilder switchPrefix(String switchPrefix) { this.switchPrefix = switchPrefix; return this; }
        public SettingsBuilder nvrPrefix(String nvrPrefix) { this.nvrPrefix = nvrPrefix; return this; }
        public SettingsBuilder routerPrefix(String routerPrefix) { this.routerPrefix = routerPrefix; return this; }
        public SettingsBuilder accessPointPrefix(String accessPointPrefix) { this.accessPointPrefix = accessPointPrefix; return this; }
        public SettingsBuilder upsPrefix(String upsPrefix) { this.upsPrefix = upsPrefix; return this; }
        public SettingsBuilder hornSpeakerPrefix(String hornSpeakerPrefix) { this.hornSpeakerPrefix = hornSpeakerPrefix; return this; }

        public Settings build() {
            return new Settings(
                id,
                user,
                autoSaveEnabled,
                theme,
                language,
                cameraPrefix,
                switchPrefix,
                nvrPrefix,
                routerPrefix,
                accessPointPrefix,
                upsPrefix,
                hornSpeakerPrefix
            );
        }
    }
}
