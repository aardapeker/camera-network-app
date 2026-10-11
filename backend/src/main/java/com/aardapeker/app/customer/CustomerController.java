package com.aardapeker.app.customer;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    private final CustomerService service;

    public CustomerController(CustomerService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<CustomerSiteResponse>> search(
            @RequestParam(required = false, defaultValue = "") String query) {
        return ResponseEntity.ok(
                service.search(query).stream().map(CustomerSiteResponse::from).toList());
    }

    @PostMapping
    public ResponseEntity<CustomerSiteResponse> quickAdd(
            @Valid @RequestBody CustomerRequests.QuickAddCustomerRequest request) {
        return ResponseEntity.ok(CustomerSiteResponse.from(service.quickAdd(request)));
    }
}
