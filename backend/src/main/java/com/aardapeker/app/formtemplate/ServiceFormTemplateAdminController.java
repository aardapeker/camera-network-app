package com.aardapeker.app.formtemplate;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/service-form-templates")
public class ServiceFormTemplateAdminController {

    private final ServiceFormTemplateService service;

    public ServiceFormTemplateAdminController(ServiceFormTemplateService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<ServiceFormTemplateResponse>> getAll() {
        return ResponseEntity.ok(
                service.getAll().stream().map(ServiceFormTemplateResponse::from).toList()
        );
    }

    @PostMapping
    public ResponseEntity<ServiceFormTemplateResponse> create(
            @Valid @RequestBody SaveServiceFormTemplateRequest request) {
        return ResponseEntity.ok(ServiceFormTemplateResponse.from(service.create(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ServiceFormTemplateResponse> update(
            @PathVariable UUID id, @Valid @RequestBody SaveServiceFormTemplateRequest request) {
        return ResponseEntity.ok(ServiceFormTemplateResponse.from(service.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/components")
    public ResponseEntity<ServiceFormTemplateComponentResponse> addComponent(
            @PathVariable UUID id, @Valid @RequestBody AddTemplateComponentRequest request) {
        int quantity = request.defaultQuantity() != null ? request.defaultQuantity() : 1;
        return ResponseEntity.ok(ServiceFormTemplateComponentResponse.from(
                service.addComponent(id, request.componentName(), quantity)));
    }

    @DeleteMapping("/{id}/components/{templateComponentId}")
    public ResponseEntity<Void> removeComponent(
            @PathVariable UUID id, @PathVariable UUID templateComponentId) {
        service.removeComponent(id, templateComponentId);
        return ResponseEntity.noContent().build();
    }
}
