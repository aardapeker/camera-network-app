package com.aardapeker.app.component;

import jakarta.validation.constraints.NotBlank;

public record CreateComponentRequest(@NotBlank String name) {}
