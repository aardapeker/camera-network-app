package com.aardapeker.app.component;

import java.util.UUID;

public record ComponentFieldResponse(UUID id, String label, ComponentFieldType fieldType, int orderIndex) {

    public static ComponentFieldResponse from(ComponentField f) {
        return new ComponentFieldResponse(f.getId(), f.getLabel(), f.getFieldType(), f.getOrderIndex());
    }
}
