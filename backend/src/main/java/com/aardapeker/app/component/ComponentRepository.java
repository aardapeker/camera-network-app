package com.aardapeker.app.component;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ComponentRepository extends JpaRepository<Component, UUID> {

    List<Component> findTop10ByOrderByNameAsc();

    List<Component> findTop10ByNameContainingIgnoreCaseOrderByNameAsc(String name);

    Optional<Component> findFirstByNameIgnoreCase(String name);

    @Query("SELECT DISTINCT c FROM Component c LEFT JOIN FETCH c.fields ORDER BY c.name ASC")
    List<Component> findAllWithFields();
}
