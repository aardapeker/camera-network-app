package com.aardapeker.app.formtemplate;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Technician-facing endpoints: list the breakdown templates and turn rough field
 * notes into draft service form text.
 */
@RestController
@RequestMapping("/api/service-form-templates")
public class ServiceFormTemplateController {

    private final ServiceFormTemplateService templateService;
    private final TemplateDraftService draftService;

    public ServiceFormTemplateController(
            ServiceFormTemplateService templateService,
            TemplateDraftService draftService) {
        this.templateService = templateService;
        this.draftService = draftService;
    }

    @GetMapping
    public ResponseEntity<List<ServiceFormTemplateResponse>> getActive() {
        return ResponseEntity.ok(
                templateService.getActive().stream().map(ServiceFormTemplateResponse::from).toList()
        );
    }

    @PostMapping("/draft")
    public ResponseEntity<TemplateDraftResponse> draft(@Valid @RequestBody TemplateDraftRequest request) {
        return ResponseEntity.ok(draftService.draft(request));
    }
}
