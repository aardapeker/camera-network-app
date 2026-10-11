package com.aardapeker.app.component;

import java.util.List;
import java.util.UUID;

public record ComponentResponse(UUID id, String name, List<ComponentFieldResponse> fields) {

    public static ComponentResponse from(Component c) {
        return new ComponentResponse(
                c.getId(),
                c.getName(),
                c.getFields().stream().map(ComponentFieldResponse::from).toList()
        );
    }
}
