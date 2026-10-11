package com.aardapeker.app.formtemplate;

import com.aardapeker.app.component.Component;
import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;

import java.util.UUID;

/**
 * A component from the catalog that this template normally consumes, so the draft
 * can pre-fill the products list (e.g. line cut -> CAT6 cable, RJ45 connector).
 */
@Entity
@Table(name = "service_form_template_components")
public class ServiceFormTemplateComponent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "template_id", nullable = false)
    @JsonBackReference("template_components")
    private ServiceFormTemplate template;

    @ManyToOne
    @JoinColumn(name = "component_id", nullable = false)
    private Component component;

    @Column(nullable = false)
    private int defaultQuantity = 1;

    @Column(nullable = false)
    private int orderIndex;

    public ServiceFormTemplateComponent() {}

    public ServiceFormTemplateComponent(
            UUID id, ServiceFormTemplate template, Component component,
            int defaultQuantity, int orderIndex) {
        this.id = id;
        this.template = template;
        this.component = component;
        this.defaultQuantity = defaultQuantity;
        this.orderIndex = orderIndex;
    }

    public UUID getId() { return id; }
    public void setId(UUID v) { this.id = v; }
    public ServiceFormTemplate getTemplate() { return template; }
    public void setTemplate(ServiceFormTemplate v) { this.template = v; }
    public Component getComponent() { return component; }
    public void setComponent(Component v) { this.component = v; }
    public int getDefaultQuantity() { return defaultQuantity; }
    public void setDefaultQuantity(int v) { this.defaultQuantity = v; }
    public int getOrderIndex() { return orderIndex; }
    public void setOrderIndex(int v) { this.orderIndex = v; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private UUID id;
        private ServiceFormTemplate template;
        private Component component;
        private int defaultQuantity = 1;
        private int orderIndex;

        public Builder id(UUID v) { this.id = v; return this; }
        public Builder template(ServiceFormTemplate v) { this.template = v; return this; }
        public Builder component(Component v) { this.component = v; return this; }
        public Builder defaultQuantity(int v) { this.defaultQuantity = v; return this; }
        public Builder orderIndex(int v) { this.orderIndex = v; return this; }

        public ServiceFormTemplateComponent build() {
            return new ServiceFormTemplateComponent(id, template, component, defaultQuantity, orderIndex);
        }
    }
}
