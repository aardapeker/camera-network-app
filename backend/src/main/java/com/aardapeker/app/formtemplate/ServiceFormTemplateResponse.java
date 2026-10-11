package com.aardapeker.app.formtemplate;

import java.util.List;
import java.util.UUID;

public record ServiceFormTemplateResponse(
        UUID id,
        String nameTr,
        String nameEn,
        String promptHint,
        String faultExample,
        String serviceExample,
        boolean active,
        int orderIndex,
        List<ServiceFormTemplateComponentResponse> suggestedComponents) {

    public static ServiceFormTemplateResponse from(ServiceFormTemplate t) {
        return new ServiceFormTemplateResponse(
                t.getId(),
                t.getNameTr(),
                t.getNameEn(),
                t.getPromptHint(),
                t.getFaultExample(),
                t.getServiceExample(),
                t.isActive(),
                t.getOrderIndex(),
                t.getSuggestedComponents().stream().map(ServiceFormTemplateComponentResponse::from).toList()
        );
    }
}
