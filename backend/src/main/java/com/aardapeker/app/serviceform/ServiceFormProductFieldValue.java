package com.aardapeker.app.serviceform;

import com.aardapeker.app.component.ComponentFieldType;
import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;

import java.util.UUID;

@Entity
@Table(name = "service_form_product_field_values")
public class ServiceFormProductFieldValue {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "service_form_product_id", nullable = false)
    @JsonBackReference("product_field_values")
    private ServiceFormProduct product;

    @Column(nullable = false)
    private String label;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ComponentFieldType fieldType;

    private String value;

    public ServiceFormProductFieldValue() {}

    public ServiceFormProductFieldValue(UUID id, ServiceFormProduct product, String label, ComponentFieldType fieldType, String value) {
        this.id = id;
        this.product = product;
        this.label = label;
        this.fieldType = fieldType;
        this.value = value;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public ServiceFormProduct getProduct() { return product; }
    public void setProduct(ServiceFormProduct product) { this.product = product; }
    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
    public ComponentFieldType getFieldType() { return fieldType; }
    public void setFieldType(ComponentFieldType fieldType) { this.fieldType = fieldType; }
    public String getValue() { return value; }
    public void setValue(String value) { this.value = value; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private UUID id;
        private ServiceFormProduct product;
        private String label;
        private ComponentFieldType fieldType;
        private String value;

        public Builder id(UUID v) { this.id = v; return this; }
        public Builder product(ServiceFormProduct v) { this.product = v; return this; }
        public Builder label(String v) { this.label = v; return this; }
        public Builder fieldType(ComponentFieldType v) { this.fieldType = v; return this; }
        public Builder value(String v) { this.value = v; return this; }

        public ServiceFormProductFieldValue build() {
            return new ServiceFormProductFieldValue(id, product, label, fieldType, value);
        }
    }
}
