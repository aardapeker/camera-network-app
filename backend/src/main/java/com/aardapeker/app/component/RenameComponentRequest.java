package com.aardapeker.app.component;

import jakarta.validation.constraints.NotBlank;

public record RenameComponentRequest(@NotBlank String name) {}
