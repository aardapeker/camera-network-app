package com.aardapeker.app.component;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ComponentFieldRepository extends JpaRepository<ComponentField, UUID> {
}
