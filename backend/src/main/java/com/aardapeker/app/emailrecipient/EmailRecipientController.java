package com.aardapeker.app.emailrecipient;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/email-recipients")
public class EmailRecipientController {

    private final EmailRecipientService service;

    public EmailRecipientController(EmailRecipientService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<EmailRecipientResponse>> getAll() {
        return ResponseEntity.ok(
                service.getAll().stream().map(EmailRecipientResponse::from).toList()
        );
    }

    @PostMapping
    public ResponseEntity<EmailRecipientResponse> create(
            @Valid @RequestBody EmailRecipientRequest request) {
        return ResponseEntity.ok(EmailRecipientResponse.from(service.create(request)));
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<EmailRecipientResponse> toggle(@PathVariable UUID id) {
        return ResponseEntity.ok(EmailRecipientResponse.from(service.toggleActive(id)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
