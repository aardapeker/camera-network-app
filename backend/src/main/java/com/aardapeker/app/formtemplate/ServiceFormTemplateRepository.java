package com.aardapeker.app.formtemplate;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface ServiceFormTemplateRepository extends JpaRepository<ServiceFormTemplate, UUID> {

    @Query("SELECT DISTINCT t FROM ServiceFormTemplate t "
            + "LEFT JOIN FETCH t.suggestedComponents sc LEFT JOIN FETCH sc.component "
            + "WHERE t.active = true ORDER BY t.orderIndex ASC, t.nameTr ASC")
    List<ServiceFormTemplate> findActiveWithComponents();

    @Query("SELECT DISTINCT t FROM ServiceFormTemplate t "
            + "LEFT JOIN FETCH t.suggestedComponents sc LEFT JOIN FETCH sc.component "
            + "ORDER BY t.orderIndex ASC, t.nameTr ASC")
    List<ServiceFormTemplate> findAllWithComponents();
}
