package com.aardapeker.app.component;

import com.aardapeker.app.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ComponentServiceImpl implements ComponentService {

    private final ComponentRepository repository;
    private final ComponentFieldRepository fieldRepository;

    public ComponentServiceImpl(ComponentRepository repository, ComponentFieldRepository fieldRepository) {
        this.repository = repository;
        this.fieldRepository = fieldRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Component> search(String query) {
        String trimmed = query == null ? "" : query.trim();
        if (trimmed.isEmpty()) {
            return repository.findTop10ByOrderByNameAsc();
        }
        return repository.findTop10ByNameContainingIgnoreCaseOrderByNameAsc(trimmed);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Component> findByName(String name) {
        if (name == null || name.isBlank()) return Optional.empty();
        return repository.findFirstByNameIgnoreCase(name.trim());
    }

    @Override
    @Transactional
    public Component findOrCreate(String name) {
        String normalizedName = name.trim();

        return repository.findFirstByNameIgnoreCase(normalizedName)
                .orElseGet(() -> repository.save(
                        Component.builder()
                                .name(normalizedName)
                                .build()
                ));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Component> getAllWithFields() {
        return repository.findAllWithFields();
    }

    @Override
    @Transactional
    public Component create(String name) {
        return repository.save(Component.builder().name(name.trim()).build());
    }

    @Override
    @Transactional
    public Component rename(UUID id, String name) {
        Component component = getComponentOrThrow(id);
        component.setName(name.trim());
        return repository.save(component);
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        Component component = getComponentOrThrow(id);
        repository.delete(component);
    }

    @Override
    @Transactional
    public ComponentField addField(UUID componentId, String label, ComponentFieldType fieldType) {
        Component component = getComponentOrThrow(componentId);
        int nextOrder = component.getFields().size();
        ComponentField field = ComponentField.builder()
                .component(component)
                .label(label.trim())
                .fieldType(fieldType)
                .orderIndex(nextOrder)
                .build();
        return fieldRepository.save(field);
    }

    @Override
    @Transactional
    public ComponentField updateField(UUID componentId, UUID fieldId, String label, ComponentFieldType fieldType) {
        ComponentField field = getFieldOrThrow(componentId, fieldId);
        field.setLabel(label.trim());
        field.setFieldType(fieldType);
        return fieldRepository.save(field);
    }

    @Override
    @Transactional
    public void deleteField(UUID componentId, UUID fieldId) {
        ComponentField field = getFieldOrThrow(componentId, fieldId);
        fieldRepository.delete(field);
    }

    private Component getComponentOrThrow(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Component not found: " + id));
    }

    private ComponentField getFieldOrThrow(UUID componentId, UUID fieldId) {
        ComponentField field = fieldRepository.findById(fieldId)
                .orElseThrow(() -> new ResourceNotFoundException("Component field not found: " + fieldId));
        if (!field.getComponent().getId().equals(componentId)) {
            throw new ResourceNotFoundException("Component field not found: " + fieldId);
        }
        return field;
    }
}
