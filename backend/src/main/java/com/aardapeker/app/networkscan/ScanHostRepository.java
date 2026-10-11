package com.aardapeker.app.networkscan;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ScanHostRepository
    extends JpaRepository<ScanHost, UUID>, JpaSpecificationExecutor<ScanHost> {

  @Query("SELECT DISTINCT s.sourceId FROM ScanHost s ORDER BY s.sourceId")
  List<String> findDistinctSourceIds();

  Optional<ScanHost> findTopBySourceIdOrderByCreatedAtDesc(String sourceId);

  @Modifying
  @Query("DELETE FROM ScanHost s WHERE s.sourceId = :sourceId AND s.scannedAt < :cutoff")
  int deleteBySourceIdAndScannedAtBefore(@Param("sourceId") String sourceId, @Param("cutoff") LocalDateTime cutoff);
}
