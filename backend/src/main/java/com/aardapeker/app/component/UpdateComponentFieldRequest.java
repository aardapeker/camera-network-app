package com.aardapeker.app.component;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UpdateComponentFieldRequest(@NotBlank String label, @NotNull ComponentFieldType fieldType) {}
