package com.aardapeker.app.networkscan;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "scan_agent_settings")
public class ScanAgentSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String sourceId;

    private Integer retentionDays;

    private Integer minWriteIntervalSeconds;

    public ScanAgentSettings() {}

    public ScanAgentSettings(UUID id, String sourceId, Integer retentionDays, Integer minWriteIntervalSeconds) {
        this.id = id;
        this.sourceId = sourceId;
        this.retentionDays = retentionDays;
        this.minWriteIntervalSeconds = minWriteIntervalSeconds;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getSourceId() { return sourceId; }
    public void setSourceId(String sourceId) { this.sourceId = sourceId; }
    public Integer getRetentionDays() { return retentionDays; }
    public void setRetentionDays(Integer retentionDays) { this.retentionDays = retentionDays; }
    public Integer getMinWriteIntervalSeconds() { return minWriteIntervalSeconds; }
    public void setMinWriteIntervalSeconds(Integer minWriteIntervalSeconds) { this.minWriteIntervalSeconds = minWriteIntervalSeconds; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private UUID id;
        private String sourceId;
        private Integer retentionDays;
        private Integer minWriteIntervalSeconds;

        public Builder id(UUID v) { this.id = v; return this; }
        public Builder sourceId(String v) { this.sourceId = v; return this; }
        public Builder retentionDays(Integer v) { this.retentionDays = v; return this; }
        public Builder minWriteIntervalSeconds(Integer v) { this.minWriteIntervalSeconds = v; return this; }

        public ScanAgentSettings build() {
            return new ScanAgentSettings(id, sourceId, retentionDays, minWriteIntervalSeconds);
        }
    }
}
