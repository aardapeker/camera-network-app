package com.aardapeker.app.formtemplate;

import jakarta.validation.constraints.NotBlank;

public record SaveServiceFormTemplateRequest(
        @NotBlank String nameTr,
        @NotBlank String nameEn,
        String promptHint,
        String faultExample,
        String serviceExample,
        Boolean active,
        Integer orderIndex) {
}
