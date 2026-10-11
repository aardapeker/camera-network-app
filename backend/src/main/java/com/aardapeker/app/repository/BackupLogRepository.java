package com.aardapeker.app.repository;

import com.aardapeker.app.model.BackupLog;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BackupLogRepository extends JpaRepository<BackupLog, UUID> {

    List<BackupLog> findAllByOrderByTimestampDesc();

    List<BackupLog> findAllByStatus(BackupLog.BackupStatus status);
}
