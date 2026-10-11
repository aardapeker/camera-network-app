package com.aardapeker.app.formtemplate;

import com.aardapeker.app.component.Component;
import com.aardapeker.app.component.ComponentService;
import com.aardapeker.app.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class ServiceFormTemplateServiceImpl implements ServiceFormTemplateService {

    private final ServiceFormTemplateRepository repository;
    private final ServiceFormTemplateComponentRepository componentRepository;
    private final ComponentService componentService;

    public ServiceFormTemplateServiceImpl(
            ServiceFormTemplateRepository repository,
            ServiceFormTemplateComponentRepository componentRepository,
            ComponentService componentService) {
        this.repository = repository;
        this.componentRepository = componentRepository;
        this.componentService = componentService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ServiceFormTemplate> getActive() {
        return repository.findActiveWithComponents();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ServiceFormTemplate> getAll() {
        return repository.findAllWithComponents();
    }

    @Override
    @Transactional(readOnly = true)
    public ServiceFormTemplate getById(UUID id) {
        return getOrThrow(id);
    }

    @Override
    @Transactional
    public ServiceFormTemplate create(SaveServiceFormTemplateRequest request) {
        ServiceFormTemplate template = ServiceFormTemplate.builder()
                .nameTr(request.nameTr().trim())
                .nameEn(request.nameEn().trim())
                .promptHint(trimOrNull(request.promptHint()))
                .faultExample(trimOrNull(request.faultExample()))
                .serviceExample(trimOrNull(request.serviceExample()))
                .active(request.active() == null || request.active())
                .orderIndex(request.orderIndex() != null ? request.orderIndex() : (int) repository.count())
                .build();
        return repository.save(template);
    }

    @Override
    @Transactional
    public ServiceFormTemplate update(UUID id, SaveServiceFormTemplateRequest request) {
        ServiceFormTemplate template = getOrThrow(id);
        template.setNameTr(request.nameTr().trim());
        template.setNameEn(request.nameEn().trim());
        template.setPromptHint(trimOrNull(request.promptHint()));
        template.setFaultExample(trimOrNull(request.faultExample()));
        template.setServiceExample(trimOrNull(request.serviceExample()));
        if (request.active() != null) template.setActive(request.active());
        if (request.orderIndex() != null) template.setOrderIndex(request.orderIndex());
        return repository.save(template);
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        repository.delete(getOrThrow(id));
    }

    @Override
    @Transactional
    public ServiceFormTemplateComponent addComponent(UUID templateId, String componentName, int defaultQuantity) {
        ServiceFormTemplate template = getOrThrow(templateId);
        Component component = componentService.findOrCreate(componentName);

        boolean alreadyLinked = template.getSuggestedComponents().stream()
                .anyMatch(tc -> tc.getComponent().getId().equals(component.getId()));
        if (alreadyLinked) {
            return template.getSuggestedComponents().stream()
                    .filter(tc -> tc.getComponent().getId().equals(component.getId()))
                    .findFirst()
                    .orElseThrow();
        }

        ServiceFormTemplateComponent link = ServiceFormTemplateComponent.builder()
                .template(template)
                .component(component)
                .defaultQuantity(Math.max(1, defaultQuantity))
                .orderIndex(template.getSuggestedComponents().size())
                .build();
        return componentRepository.save(link);
    }

    @Override
    @Transactional
    public void removeComponent(UUID templateId, UUID templateComponentId) {
        ServiceFormTemplateComponent link = componentRepository.findById(templateComponentId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Template component not found: " + templateComponentId));
        if (!link.getTemplate().getId().equals(templateId)) {
            throw new ResourceNotFoundException("Template component not found: " + templateComponentId);
        }
        componentRepository.delete(link);
    }

    private ServiceFormTemplate getOrThrow(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service form template not found: " + id));
    }

    private static String trimOrNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
