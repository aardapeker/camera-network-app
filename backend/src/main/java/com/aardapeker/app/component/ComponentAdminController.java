package com.aardapeker.app.component;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/components")
public class ComponentAdminController {

    private final ComponentService service;

    public ComponentAdminController(ComponentService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<ComponentAdminResponse>> getAll() {
        return ResponseEntity.ok(
                service.getAllWithFields().stream().map(ComponentAdminResponse::from).toList()
        );
    }

    @PostMapping
    public ResponseEntity<ComponentAdminResponse> create(@Valid @RequestBody CreateComponentRequest request) {
        return ResponseEntity.ok(ComponentAdminResponse.from(service.create(request.name())));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ComponentAdminResponse> rename(
            @PathVariable UUID id, @Valid @RequestBody RenameComponentRequest request) {
        return ResponseEntity.ok(ComponentAdminResponse.from(service.rename(id, request.name())));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/fields")
    public ResponseEntity<ComponentFieldResponse> addField(
            @PathVariable UUID id, @Valid @RequestBody CreateComponentFieldRequest request) {
        ComponentField field = service.addField(id, request.label(), request.fieldType());
        return ResponseEntity.ok(ComponentFieldResponse.from(field));
    }

    @PatchMapping("/{id}/fields/{fieldId}")
    public ResponseEntity<ComponentFieldResponse> updateField(
            @PathVariable UUID id, @PathVariable UUID fieldId,
            @Valid @RequestBody UpdateComponentFieldRequest request) {
        ComponentField field = service.updateField(id, fieldId, request.label(), request.fieldType());
        return ResponseEntity.ok(ComponentFieldResponse.from(field));
    }

    @DeleteMapping("/{id}/fields/{fieldId}")
    public ResponseEntity<Void> deleteField(@PathVariable UUID id, @PathVariable UUID fieldId) {
        service.deleteField(id, fieldId);
        return ResponseEntity.noContent().build();
    }
}
