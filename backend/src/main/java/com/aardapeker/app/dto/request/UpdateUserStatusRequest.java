package com.aardapeker.app.dto.request;

import com.aardapeker.app.model.Status;
import jakarta.validation.constraints.NotNull;

public record UpdateUserStatusRequest(@NotNull Status status) {}
