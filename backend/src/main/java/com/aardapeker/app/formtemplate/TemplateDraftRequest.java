package com.aardapeker.app.formtemplate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/**
 * The technician's rough field notes (typed or dictated) plus the breakdown
 * template they picked.
 */
public record TemplateDraftRequest(
        @NotNull UUID templateId,
        @NotBlank String notes,
        String language,
        String customerName,
        /** The form's service date (yyyy-MM-dd), so "dun"/"bugun" resolve to real dates. */
        String serviceDate) {
}
