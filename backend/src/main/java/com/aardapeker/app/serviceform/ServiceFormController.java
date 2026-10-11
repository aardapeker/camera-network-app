package com.aardapeker.app.serviceform;

import com.aardapeker.app.model.Role;
import com.aardapeker.app.model.User;
import com.aardapeker.app.exception.ForbiddenActionException;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/service-forms")
public class ServiceFormController {

    private final ServiceFormService service;

    public ServiceFormController(ServiceFormService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<ServiceFormResponse> submit(
            @Valid @RequestBody SubmitServiceFormRequest request,
            @AuthenticationPrincipal User user) {
        ServiceForm form = service.submit(request, user);
        return ResponseEntity.ok(ServiceFormResponse.from(form));
    }

    /**
     * Technicians and clients only ever see the forms they filled in themselves -
     * they reach this list from the service-form portal, outside the admin panel.
     * Managers and admins see everything.
     */
    private boolean isLimitedToOwnForms(User user) {
        return user.getAuthorities().contains(Role.ROLE_CLIENT) ||
                user.getAuthorities().contains(Role.ROLE_TECH);
    }

    /**
     * @param mine the caller's own forms only. The service-form portal's "my forms"
     *             page asks for this whatever the caller's role is, so the page
     *             shows what its title promises; the admin panel's list omits it.
     */
    @GetMapping
    public ResponseEntity<List<ServiceFormResponse>> getAll(
            @RequestParam(defaultValue = "false") boolean mine,
            @AuthenticationPrincipal User user) {
        List<ServiceForm> forms;
        if (mine || isLimitedToOwnForms(user)) {
            forms = service.getByTechnician(user.getUsername());
        } else {
            forms = service.getAll();
        }
        return ResponseEntity.ok(forms.stream().map(ServiceFormResponse::from).toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ServiceFormResponse> getById(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        ServiceForm form = service.getById(id);
        if (isLimitedToOwnForms(user)) {
            boolean isTechnician = form.getTechnician() != null &&
                    form.getTechnician().getUsername().equals(user.getUsername());
            if (!isTechnician) throw new ForbiddenActionException("Access denied");
        }
        return ResponseEntity.ok(ServiceFormResponse.from(form));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        if (user.getAuthorities().contains(Role.ROLE_CLIENT) ||
                user.getAuthorities().contains(Role.ROLE_TECH)) {
            throw new ForbiddenActionException("Only managers and admins can delete service forms");
        }
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
