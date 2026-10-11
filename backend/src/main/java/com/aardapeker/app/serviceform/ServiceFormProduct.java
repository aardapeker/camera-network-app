package com.aardapeker.app.serviceform;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "service_form_products")
public class ServiceFormProduct {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "service_form_id", nullable = false)
    @JsonBackReference("service_form_products")
    private ServiceForm serviceForm;

    @Column(nullable = false)
    private String productName;

    private int quantity;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference("product_field_values")
    private List<ServiceFormProductFieldValue> fieldValues = new ArrayList<>();

    public ServiceFormProduct() {}

    public ServiceFormProduct(UUID id, ServiceForm serviceForm, String productName, int quantity, List<ServiceFormProductFieldValue> fieldValues) {
        this.id = id;
        this.serviceForm = serviceForm;
        this.productName = productName;
        this.quantity = quantity;
        this.fieldValues = fieldValues != null ? fieldValues : new ArrayList<>();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public ServiceForm getServiceForm() { return serviceForm; }
    public void setServiceForm(ServiceForm serviceForm) { this.serviceForm = serviceForm; }
    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }
    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }
    public List<ServiceFormProductFieldValue> getFieldValues() { return fieldValues; }
    public void setFieldValues(List<ServiceFormProductFieldValue> fieldValues) { this.fieldValues = fieldValues; }

    public static ServiceFormProductBuilder builder() { return new ServiceFormProductBuilder(); }

    public static class ServiceFormProductBuilder {
        private UUID id;
        private ServiceForm serviceForm;
        private String productName;
        private int quantity;
        private List<ServiceFormProductFieldValue> fieldValues = new ArrayList<>();

        ServiceFormProductBuilder() {}

        public ServiceFormProductBuilder id(UUID id) { this.id = id; return this; }
        public ServiceFormProductBuilder serviceForm(ServiceForm sf) { this.serviceForm = sf; return this; }
        public ServiceFormProductBuilder productName(String v) { this.productName = v; return this; }
        public ServiceFormProductBuilder quantity(int v) { this.quantity = v; return this; }
        public ServiceFormProductBuilder fieldValues(List<ServiceFormProductFieldValue> v) { this.fieldValues = v; return this; }

        public ServiceFormProduct build() {
            return new ServiceFormProduct(id, serviceForm, productName, quantity, fieldValues);
        }
    }
}
