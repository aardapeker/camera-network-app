package com.aardapeker.app.formtemplate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Min;

public record AddTemplateComponentRequest(
        @NotBlank String componentName,
        @Min(1) Integer defaultQuantity) {
}
