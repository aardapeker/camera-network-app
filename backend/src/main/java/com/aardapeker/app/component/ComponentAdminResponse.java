package com.aardapeker.app.component;

import java.util.List;
import java.util.UUID;

public record ComponentAdminResponse(UUID id, String name, List<ComponentFieldResponse> fields) {

    public static ComponentAdminResponse from(Component c) {
        return new ComponentAdminResponse(
                c.getId(),
                c.getName(),
                c.getFields().stream().map(ComponentFieldResponse::from).toList()
        );
    }
}
