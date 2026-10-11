package com.aardapeker.app.formtemplate;

import java.util.List;
import java.util.UUID;

public interface ServiceFormTemplateService {

    List<ServiceFormTemplate> getActive();

    List<ServiceFormTemplate> getAll();

    ServiceFormTemplate getById(UUID id);

    ServiceFormTemplate create(SaveServiceFormTemplateRequest request);

    ServiceFormTemplate update(UUID id, SaveServiceFormTemplateRequest request);

    void delete(UUID id);

    ServiceFormTemplateComponent addComponent(UUID templateId, String componentName, int defaultQuantity);

    void removeComponent(UUID templateId, UUID templateComponentId);
}
