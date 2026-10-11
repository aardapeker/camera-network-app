package com.aardapeker.app.component;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/components")
public class ComponentController {

    private final ComponentService service;

    public ComponentController(ComponentService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<ComponentResponse>> search(
            @RequestParam(required = false, defaultValue = "") String query) {
        return ResponseEntity.ok(
                service.search(query).stream().map(ComponentResponse::from).toList()
        );
    }

    @PostMapping
    public ResponseEntity<ComponentResponse> create(@Valid @RequestBody CreateComponentRequest request) {
        Component component = service.findOrCreate(request.name());
        return ResponseEntity.ok(ComponentResponse.from(component));
    }
}
