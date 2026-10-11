package com.aardapeker.app.formtemplate;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ServiceFormTemplateComponentRepository
        extends JpaRepository<ServiceFormTemplateComponent, UUID> {
}
