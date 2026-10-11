package com.aardapeker.app.repository;

import com.aardapeker.app.model.Settings;
import com.aardapeker.app.model.User;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SettingsRepository extends JpaRepository<Settings, UUID> {
    Optional<Settings> findByUser(User user);
}
