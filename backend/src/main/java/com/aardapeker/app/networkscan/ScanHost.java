package com.aardapeker.app.networkscan;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "scan_hosts")
public class ScanHost {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID scanBatchId;

    @Column(nullable = false)
    private String sourceId;

    private String subnet;

    private LocalDateTime scannedAt;

    @Column(nullable = false)
    private String ipAddress;

    private String macAddress;

    private String vendor;

    private String hostname;

    @Column(length = 500)
    private String openPorts;

    @CreationTimestamp
    private LocalDateTime createdAt;

    public ScanHost() {}

    public ScanHost(
            UUID id,
            UUID scanBatchId,
            String sourceId,
            String subnet,
            LocalDateTime scannedAt,
            String ipAddress,
            String macAddress,
            String vendor,
            String hostname,
            String openPorts,
            LocalDateTime createdAt) {
        this.id = id;
        this.scanBatchId = scanBatchId;
        this.sourceId = sourceId;
        this.subnet = subnet;
        this.scannedAt = scannedAt;
        this.ipAddress = ipAddress;
        this.macAddress = macAddress;
        this.vendor = vendor;
        this.hostname = hostname;
        this.openPorts = openPorts;
        this.createdAt = createdAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getScanBatchId() { return scanBatchId; }
    public void setScanBatchId(UUID scanBatchId) { this.scanBatchId = scanBatchId; }
    public String getSourceId() { return sourceId; }
    public void setSourceId(String sourceId) { this.sourceId = sourceId; }
    public String getSubnet() { return subnet; }
    public void setSubnet(String subnet) { this.subnet = subnet; }
    public LocalDateTime getScannedAt() { return scannedAt; }
    public void setScannedAt(LocalDateTime scannedAt) { this.scannedAt = scannedAt; }
    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }
    public String getMacAddress() { return macAddress; }
    public void setMacAddress(String macAddress) { this.macAddress = macAddress; }
    public String getVendor() { return vendor; }
    public void setVendor(String vendor) { this.vendor = vendor; }
    public String getHostname() { return hostname; }
    public void setHostname(String hostname) { this.hostname = hostname; }
    public String getOpenPorts() { return openPorts; }
    public void setOpenPorts(String openPorts) { this.openPorts = openPorts; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private UUID id;
        private UUID scanBatchId;
        private String sourceId;
        private String subnet;
        private LocalDateTime scannedAt;
        private String ipAddress;
        private String macAddress;
        private String vendor;
        private String hostname;
        private String openPorts;
        private LocalDateTime createdAt;

        public Builder id(UUID v) { this.id = v; return this; }
        public Builder scanBatchId(UUID v) { this.scanBatchId = v; return this; }
        public Builder sourceId(String v) { this.sourceId = v; return this; }
        public Builder subnet(String v) { this.subnet = v; return this; }
        public Builder scannedAt(LocalDateTime v) { this.scannedAt = v; return this; }
        public Builder ipAddress(String v) { this.ipAddress = v; return this; }
        public Builder macAddress(String v) { this.macAddress = v; return this; }
        public Builder vendor(String v) { this.vendor = v; return this; }
        public Builder hostname(String v) { this.hostname = v; return this; }
        public Builder openPorts(String v) { this.openPorts = v; return this; }
        public Builder createdAt(LocalDateTime v) { this.createdAt = v; return this; }

        public ScanHost build() {
            return new ScanHost(
                    id, scanBatchId, sourceId, subnet, scannedAt,
                    ipAddress, macAddress, vendor, hostname, openPorts, createdAt);
        }
    }
}
