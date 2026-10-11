package com.aardapeker.app.component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ComponentService {

    List<Component> search(String query);

    Optional<Component> findByName(String name);

    Component findOrCreate(String name);

    List<Component> getAllWithFields();

    Component create(String name);

    Component rename(UUID id, String name);

    void delete(UUID id);

    ComponentField addField(UUID componentId, String label, ComponentFieldType fieldType);

    ComponentField updateField(UUID componentId, UUID fieldId, String label, ComponentFieldType fieldType);

    void deleteField(UUID componentId, UUID fieldId);
}
