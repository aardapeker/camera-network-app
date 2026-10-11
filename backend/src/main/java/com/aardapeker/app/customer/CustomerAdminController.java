package com.aardapeker.app.customer;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/customers")
public class CustomerAdminController {

    private final CustomerService service;

    public CustomerAdminController(CustomerService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<CustomerResponse>> getAll() {
        return ResponseEntity.ok(service.getAll().stream().map(CustomerResponse::from).toList());
    }

    @PostMapping
    public ResponseEntity<CustomerResponse> create(
            @Valid @RequestBody CustomerRequests.SaveCustomerRequest request) {
        return ResponseEntity.ok(CustomerResponse.from(service.create(request.name(), request.shortName())));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CustomerResponse> update(
            @PathVariable UUID id, @Valid @RequestBody CustomerRequests.SaveCustomerRequest request) {
        return ResponseEntity.ok(CustomerResponse.from(service.update(id, request.name(), request.shortName())));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/sites")
    public ResponseEntity<CustomerSiteResponse> addSite(
            @PathVariable UUID id, @Valid @RequestBody CustomerRequests.SaveCustomerSiteRequest request) {
        return ResponseEntity.ok(CustomerSiteResponse.from(service.addSite(id, request)));
    }

    @PutMapping("/{id}/sites/{siteId}")
    public ResponseEntity<CustomerSiteResponse> updateSite(
            @PathVariable UUID id, @PathVariable UUID siteId,
            @Valid @RequestBody CustomerRequests.SaveCustomerSiteRequest request) {
        return ResponseEntity.ok(CustomerSiteResponse.from(service.updateSite(id, siteId, request)));
    }

    @DeleteMapping("/{id}/sites/{siteId}")
    public ResponseEntity<Void> deleteSite(@PathVariable UUID id, @PathVariable UUID siteId) {
        service.deleteSite(id, siteId);
        return ResponseEntity.noContent().build();
    }
}
