package com.aardapeker.app.component;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;

import java.util.UUID;

@Entity
@Table(name = "component_fields")
public class ComponentField {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "component_id", nullable = false)
    @JsonBackReference("component_fields")
    private Component component;

    @Column(nullable = false)
    private String label;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ComponentFieldType fieldType;

    @Column(nullable = false)
    private int orderIndex;

    public ComponentField() {}

    public ComponentField(UUID id, Component component, String label, ComponentFieldType fieldType, int orderIndex) {
        this.id = id;
        this.component = component;
        this.label = label;
        this.fieldType = fieldType;
        this.orderIndex = orderIndex;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public Component getComponent() { return component; }
    public void setComponent(Component component) { this.component = component; }
    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
    public ComponentFieldType getFieldType() { return fieldType; }
    public void setFieldType(ComponentFieldType fieldType) { this.fieldType = fieldType; }
    public int getOrderIndex() { return orderIndex; }
    public void setOrderIndex(int orderIndex) { this.orderIndex = orderIndex; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private UUID id;
        private Component component;
        private String label;
        private ComponentFieldType fieldType;
        private int orderIndex;

        public Builder id(UUID v) { this.id = v; return this; }
        public Builder component(Component v) { this.component = v; return this; }
        public Builder label(String v) { this.label = v; return this; }
        public Builder fieldType(ComponentFieldType v) { this.fieldType = v; return this; }
        public Builder orderIndex(int v) { this.orderIndex = v; return this; }

        public ComponentField build() {
            return new ComponentField(id, component, label, fieldType, orderIndex);
        }
    }
}
