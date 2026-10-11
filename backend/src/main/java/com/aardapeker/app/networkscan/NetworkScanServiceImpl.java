package com.aardapeker.app.networkscan;

import com.aardapeker.app.dto.response.PageResponse;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NetworkScanServiceImpl implements NetworkScanService {

    // Maps public API sortBy values (matching ScanHostResponse's JSON field names)
    // to the underlying ScanHost entity property names Sort.by() needs.
    private static final Map<String, String> SORTABLE_PROPERTIES = Map.of(
            "scannedAt", "scannedAt",
            "ip", "ipAddress",
            "vendor", "vendor",
            "hostname", "hostname",
            "sourceId", "sourceId");

    private final ScanHostRepository repository;
    private final ScanAgentSettingsRepository agentSettingsRepository;
    private final int defaultRetentionDays;
    private final int defaultMinWriteIntervalSeconds;

    public NetworkScanServiceImpl(
            ScanHostRepository repository,
            ScanAgentSettingsRepository agentSettingsRepository,
            @Value("${scan.default-retention-days:30}") int defaultRetentionDays,
            @Value("${scan.default-min-write-interval-seconds:60}") int defaultMinWriteIntervalSeconds) {
        this.repository = repository;
        this.agentSettingsRepository = agentSettingsRepository;
        this.defaultRetentionDays = defaultRetentionDays;
        this.defaultMinWriteIntervalSeconds = defaultMinWriteIntervalSeconds;
    }

    @Override
    @Transactional
    public List<ScanHost> recordBatch(ScanBatchRequest request) {
        String sourceId = request.sourceId().trim();

        int minWriteIntervalSeconds = resolveMinWriteIntervalSeconds(sourceId);
        LocalDateTime lastWrite = repository.findTopBySourceIdOrderByCreatedAtDesc(sourceId)
                .map(ScanHost::getCreatedAt)
                .orElse(null);

        if (lastWrite != null
                && Duration.between(lastWrite, LocalDateTime.now()).getSeconds() < minWriteIntervalSeconds) {
            // Accepted, but throttled: too soon since the last persisted write for this agent.
            return List.of();
        }

        UUID scanBatchId = UUID.randomUUID();
        LocalDateTime scannedAt = request.scannedAt() != null ? request.scannedAt() : LocalDateTime.now();

        List<ScanHost> hosts = request.hosts().stream()
                .map(h -> ScanHost.builder()
                        .scanBatchId(scanBatchId)
                        .sourceId(sourceId)
                        .subnet(request.subnet())
                        .scannedAt(scannedAt)
                        .ipAddress(h.ip())
                        .macAddress(h.mac())
                        .vendor(h.vendor())
                        .hostname(h.hostname())
                        .openPorts(h.ports() == null || h.ports().isEmpty()
                                ? null
                                : h.ports().stream().map(String::valueOf).reduce((a, b) -> a + "," + b).orElse(null))
                        .build())
                .toList();

        return repository.saveAll(hosts);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ScanHostResponse> getPage(GetNetworkScansRequest request) {
        Specification<ScanHost> spec = buildSpecification(request);

        Sort.Direction direction = "ASC".equalsIgnoreCase(request.sortDirection())
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;

        Pageable pageable = PageRequest.of(
                request.page(),
                request.size(),
                Sort.by(direction, resolveSortProperty(request.sortBy())));

        Page<ScanHost> hosts = repository.findAll(spec, pageable);
        Page<ScanHostResponse> mapped = hosts.map(ScanHostResponse::from);

        return PageResponse.of(mapped);
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> getDistinctSources() {
        return repository.findDistinctSourceIds();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ScanAgentSettingsResponse> listAgentSettings() {
        return repository.findDistinctSourceIds().stream()
                .map(sourceId -> {
                    ScanAgentSettings settings = agentSettingsRepository.findBySourceId(sourceId).orElse(null);
                    boolean retentionIsDefault = settings == null || settings.getRetentionDays() == null;
                    boolean intervalIsDefault = settings == null || settings.getMinWriteIntervalSeconds() == null;
                    return new ScanAgentSettingsResponse(
                            sourceId,
                            retentionIsDefault ? defaultRetentionDays : settings.getRetentionDays(),
                            intervalIsDefault ? defaultMinWriteIntervalSeconds : settings.getMinWriteIntervalSeconds(),
                            retentionIsDefault,
                            intervalIsDefault);
                })
                .toList();
    }

    @Override
    @Transactional
    public ScanAgentSettingsResponse saveAgentSettings(String sourceId, ScanAgentSettingsRequest request) {
        ScanAgentSettings settings = agentSettingsRepository.findBySourceId(sourceId)
                .orElseGet(() -> ScanAgentSettings.builder().sourceId(sourceId).build());

        settings.setRetentionDays(request.retentionDays());
        settings.setMinWriteIntervalSeconds(request.minWriteIntervalSeconds());
        agentSettingsRepository.save(settings);

        return new ScanAgentSettingsResponse(
                sourceId,
                request.retentionDays() != null ? request.retentionDays() : defaultRetentionDays,
                request.minWriteIntervalSeconds() != null ? request.minWriteIntervalSeconds() : defaultMinWriteIntervalSeconds,
                request.retentionDays() == null,
                request.minWriteIntervalSeconds() == null);
    }

    @Override
    @Transactional
    public int cleanupExpiredForSource(String sourceId) {
        int retentionDays = resolveRetentionDays(sourceId);
        LocalDateTime cutoff = LocalDateTime.now().minusDays(retentionDays);
        return repository.deleteBySourceIdAndScannedAtBefore(sourceId, cutoff);
    }

    private int resolveRetentionDays(String sourceId) {
        return agentSettingsRepository.findBySourceId(sourceId)
                .map(ScanAgentSettings::getRetentionDays)
                .orElse(defaultRetentionDays);
    }

    private int resolveMinWriteIntervalSeconds(String sourceId) {
        return agentSettingsRepository.findBySourceId(sourceId)
                .map(ScanAgentSettings::getMinWriteIntervalSeconds)
                .orElse(defaultMinWriteIntervalSeconds);
    }

    private Specification<ScanHost> buildSpecification(GetNetworkScansRequest request) {
        Specification<ScanHost> spec = Specification.where(null);

        if (request.filterBy() != null && request.filterInput() != null) {
            spec = spec.and(
                    ScanHostSpecifications.textFilter(
                            NetworkScanFilterBy.from(request.filterBy()),
                            request.filterInput()));
        }

        if (request.sources() != null && !request.sources().isEmpty()) {
            spec = spec.and(ScanHostSpecifications.hasSources(request.sources()));
        }

        return spec;
    }

    private String resolveSortProperty(String sortBy) {
        return SORTABLE_PROPERTIES.getOrDefault(sortBy, "scannedAt");
    }
}
