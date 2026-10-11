package com.aardapeker.app.networkscan;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ScanAgentSettingsRepository extends JpaRepository<ScanAgentSettings, UUID> {

    Optional<ScanAgentSettings> findBySourceId(String sourceId);
}
