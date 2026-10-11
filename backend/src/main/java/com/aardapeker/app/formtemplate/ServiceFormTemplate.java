package com.aardapeker.app.formtemplate;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * A reusable breakdown template (camera fault, line cut, ...) that the AI draft
 * assistant uses to turn a technician's rough field notes into service form text.
 */
@Entity
@Table(name = "service_form_templates")
public class ServiceFormTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String nameTr;

    @Column(nullable = false)
    private String nameEn;

    /** Extra instructions for the model: what this breakdown type usually involves. */
    @Column(columnDefinition = "TEXT")
    private String promptHint;

    /** Example fault description written in the company's own wording. */
    @Column(columnDefinition = "TEXT")
    private String faultExample;

    /** Example service description written in the company's own wording. */
    @Column(columnDefinition = "TEXT")
    private String serviceExample;

    @Column(nullable = false)
    private boolean active = true;

    @Column(nullable = false)
    private int orderIndex;

    @OneToMany(mappedBy = "template", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderIndex ASC")
    @JsonManagedReference("template_components")
    private List<ServiceFormTemplateComponent> suggestedComponents = new ArrayList<>();

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public ServiceFormTemplate() {}

    public ServiceFormTemplate(
            UUID id, String nameTr, String nameEn, String promptHint, String faultExample,
            String serviceExample, boolean active, int orderIndex,
            List<ServiceFormTemplateComponent> suggestedComponents,
            LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.nameTr = nameTr;
        this.nameEn = nameEn;
        this.promptHint = promptHint;
        this.faultExample = faultExample;
        this.serviceExample = serviceExample;
        this.active = active;
        this.orderIndex = orderIndex;
        this.suggestedComponents = suggestedComponents != null ? suggestedComponents : new ArrayList<>();
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID v) { this.id = v; }
    public String getNameTr() { return nameTr; }
    public void setNameTr(String v) { this.nameTr = v; }
    public String getNameEn() { return nameEn; }
    public void setNameEn(String v) { this.nameEn = v; }
    public String getPromptHint() { return promptHint; }
    public void setPromptHint(String v) { this.promptHint = v; }
    public String getFaultExample() { return faultExample; }
    public void setFaultExample(String v) { this.faultExample = v; }
    public String getServiceExample() { return serviceExample; }
    public void setServiceExample(String v) { this.serviceExample = v; }
    public boolean isActive() { return active; }
    public void setActive(boolean v) { this.active = v; }
    public int getOrderIndex() { return orderIndex; }
    public void setOrderIndex(int v) { this.orderIndex = v; }
    public List<ServiceFormTemplateComponent> getSuggestedComponents() { return suggestedComponents; }
    public void setSuggestedComponents(List<ServiceFormTemplateComponent> v) { this.suggestedComponents = v; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime v) { this.createdAt = v; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime v) { this.updatedAt = v; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private UUID id;
        private String nameTr, nameEn, promptHint, faultExample, serviceExample;
        private boolean active = true;
        private int orderIndex;
        private List<ServiceFormTemplateComponent> suggestedComponents = new ArrayList<>();
        private LocalDateTime createdAt, updatedAt;

        public Builder id(UUID v) { this.id = v; return this; }
        public Builder nameTr(String v) { this.nameTr = v; return this; }
        public Builder nameEn(String v) { this.nameEn = v; return this; }
        public Builder promptHint(String v) { this.promptHint = v; return this; }
        public Builder faultExample(String v) { this.faultExample = v; return this; }
        public Builder serviceExample(String v) { this.serviceExample = v; return this; }
        public Builder active(boolean v) { this.active = v; return this; }
        public Builder orderIndex(int v) { this.orderIndex = v; return this; }
        public Builder suggestedComponents(List<ServiceFormTemplateComponent> v) { this.suggestedComponents = v; return this; }
        public Builder createdAt(LocalDateTime v) { this.createdAt = v; return this; }
        public Builder updatedAt(LocalDateTime v) { this.updatedAt = v; return this; }

        public ServiceFormTemplate build() {
            return new ServiceFormTemplate(id, nameTr, nameEn, promptHint, faultExample,
                    serviceExample, active, orderIndex, suggestedComponents, createdAt, updatedAt);
        }
    }
}
