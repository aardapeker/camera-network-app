package com.aardapeker.app.formtemplate;

import com.aardapeker.app.component.ComponentFieldResponse;

import java.util.List;
import java.util.UUID;

public record ServiceFormTemplateComponentResponse(
        UUID id,
        UUID componentId,
        String componentName,
        int defaultQuantity,
        List<ComponentFieldResponse> fields) {

    public static ServiceFormTemplateComponentResponse from(ServiceFormTemplateComponent tc) {
        return new ServiceFormTemplateComponentResponse(
                tc.getId(),
                tc.getComponent().getId(),
                tc.getComponent().getName(),
                tc.getDefaultQuantity(),
                tc.getComponent().getFields().stream().map(ComponentFieldResponse::from).toList()
        );
    }
}
