package com.aardapeker.app.serviceform;

import com.aardapeker.app.model.User;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "service_forms")
public class ServiceForm {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String customerName;
    private String contactPerson;
    private String phone;
    private String email;

    @Column(length = 1024)
    private String address;

    private LocalDate serviceDate;
    private LocalTime arrivalTime;
    private LocalTime deliveryTime;

    @Column(length = 2048)
    private String notification;

    private Integer staffCount;

    @Enumerated(EnumType.STRING)
    private ServiceLocation serviceLocation;

    @Enumerated(EnumType.STRING)
    private ServiceFormStatus serviceStatus;

    @Column(columnDefinition = "TEXT")
    private String faultDescription;

    @Column(columnDefinition = "TEXT")
    private String serviceDescription;

    @Column(columnDefinition = "TEXT")
    private String deliveryNotes;

    // Stored as base64 data URL
    @Column(columnDefinition = "TEXT")
    private String customerSignature;

    @Column(columnDefinition = "TEXT")
    private String technicianSignature;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FormSyncStatus syncStatus = FormSyncStatus.DRAFT;

    @OneToMany(mappedBy = "serviceForm", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference("service_form_products")
    private List<ServiceFormProduct> products = new ArrayList<>();

    @ManyToOne
    @JoinColumn(name = "technician_id", nullable = true)
    private User technician;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public ServiceForm() {}

    public ServiceForm(
            UUID id, String customerName, String contactPerson, String phone, String email,
            String address, LocalDate serviceDate, LocalTime arrivalTime, LocalTime deliveryTime,
            String notification, Integer staffCount, ServiceLocation serviceLocation,
            ServiceFormStatus serviceStatus, String faultDescription, String serviceDescription,
            String deliveryNotes, String customerSignature, String technicianSignature,
            FormSyncStatus syncStatus, List<ServiceFormProduct> products, User technician,
            LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.customerName = customerName;
        this.contactPerson = contactPerson;
        this.phone = phone;
        this.email = email;
        this.address = address;
        this.serviceDate = serviceDate;
        this.arrivalTime = arrivalTime;
        this.deliveryTime = deliveryTime;
        this.notification = notification;
        this.staffCount = staffCount;
        this.serviceLocation = serviceLocation;
        this.serviceStatus = serviceStatus;
        this.faultDescription = faultDescription;
        this.serviceDescription = serviceDescription;
        this.deliveryNotes = deliveryNotes;
        this.customerSignature = customerSignature;
        this.technicianSignature = technicianSignature;
        this.syncStatus = syncStatus;
        this.products = products;
        this.technician = technician;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String v) { this.customerName = v; }
    public String getContactPerson() { return contactPerson; }
    public void setContactPerson(String v) { this.contactPerson = v; }
    public String getPhone() { return phone; }
    public void setPhone(String v) { this.phone = v; }
    public String getEmail() { return email; }
    public void setEmail(String v) { this.email = v; }
    public String getAddress() { return address; }
    public void setAddress(String v) { this.address = v; }
    public LocalDate getServiceDate() { return serviceDate; }
    public void setServiceDate(LocalDate v) { this.serviceDate = v; }
    public LocalTime getArrivalTime() { return arrivalTime; }
    public void setArrivalTime(LocalTime v) { this.arrivalTime = v; }
    public LocalTime getDeliveryTime() { return deliveryTime; }
    public void setDeliveryTime(LocalTime v) { this.deliveryTime = v; }
    public String getNotification() { return notification; }
    public void setNotification(String v) { this.notification = v; }
    public Integer getStaffCount() { return staffCount; }
    public void setStaffCount(Integer v) { this.staffCount = v; }
    public ServiceLocation getServiceLocation() { return serviceLocation; }
    public void setServiceLocation(ServiceLocation v) { this.serviceLocation = v; }
    public ServiceFormStatus getServiceStatus() { return serviceStatus; }
    public void setServiceStatus(ServiceFormStatus v) { this.serviceStatus = v; }
    public String getFaultDescription() { return faultDescription; }
    public void setFaultDescription(String v) { this.faultDescription = v; }
    public String getServiceDescription() { return serviceDescription; }
    public void setServiceDescription(String v) { this.serviceDescription = v; }
    public String getDeliveryNotes() { return deliveryNotes; }
    public void setDeliveryNotes(String v) { this.deliveryNotes = v; }
    public String getCustomerSignature() { return customerSignature; }
    public void setCustomerSignature(String v) { this.customerSignature = v; }
    public String getTechnicianSignature() { return technicianSignature; }
    public void setTechnicianSignature(String v) { this.technicianSignature = v; }
    public FormSyncStatus getSyncStatus() { return syncStatus; }
    public void setSyncStatus(FormSyncStatus v) { this.syncStatus = v; }
    public List<ServiceFormProduct> getProducts() { return products; }
    public void setProducts(List<ServiceFormProduct> v) { this.products = v; }
    public User getTechnician() { return technician; }
    public void setTechnician(User v) { this.technician = v; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime v) { this.createdAt = v; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime v) { this.updatedAt = v; }

    public static ServiceFormBuilder builder() { return new ServiceFormBuilder(); }

    public static class ServiceFormBuilder {
        private UUID id;
        private String customerName, contactPerson, phone, email, address;
        private LocalDate serviceDate;
        private LocalTime arrivalTime, deliveryTime;
        private String notification;
        private Integer staffCount;
        private ServiceLocation serviceLocation;
        private ServiceFormStatus serviceStatus;
        private String faultDescription, serviceDescription, deliveryNotes;
        private String customerSignature, technicianSignature;
        private FormSyncStatus syncStatus = FormSyncStatus.DRAFT;
        private List<ServiceFormProduct> products = new ArrayList<>();
        private User technician;
        private LocalDateTime createdAt, updatedAt;

        ServiceFormBuilder() {}

        public ServiceFormBuilder id(UUID v) { this.id = v; return this; }
        public ServiceFormBuilder customerName(String v) { this.customerName = v; return this; }
        public ServiceFormBuilder contactPerson(String v) { this.contactPerson = v; return this; }
        public ServiceFormBuilder phone(String v) { this.phone = v; return this; }
        public ServiceFormBuilder email(String v) { this.email = v; return this; }
        public ServiceFormBuilder address(String v) { this.address = v; return this; }
        public ServiceFormBuilder serviceDate(LocalDate v) { this.serviceDate = v; return this; }
        public ServiceFormBuilder arrivalTime(LocalTime v) { this.arrivalTime = v; return this; }
        public ServiceFormBuilder deliveryTime(LocalTime v) { this.deliveryTime = v; return this; }
        public ServiceFormBuilder notification(String v) { this.notification = v; return this; }
        public ServiceFormBuilder staffCount(Integer v) { this.staffCount = v; return this; }
        public ServiceFormBuilder serviceLocation(ServiceLocation v) { this.serviceLocation = v; return this; }
        public ServiceFormBuilder serviceStatus(ServiceFormStatus v) { this.serviceStatus = v; return this; }
        public ServiceFormBuilder faultDescription(String v) { this.faultDescription = v; return this; }
        public ServiceFormBuilder serviceDescription(String v) { this.serviceDescription = v; return this; }
        public ServiceFormBuilder deliveryNotes(String v) { this.deliveryNotes = v; return this; }
        public ServiceFormBuilder customerSignature(String v) { this.customerSignature = v; return this; }
        public ServiceFormBuilder technicianSignature(String v) { this.technicianSignature = v; return this; }
        public ServiceFormBuilder syncStatus(FormSyncStatus v) { this.syncStatus = v; return this; }
        public ServiceFormBuilder products(List<ServiceFormProduct> v) { this.products = v; return this; }
        public ServiceFormBuilder technician(User v) { this.technician = v; return this; }
        public ServiceFormBuilder createdAt(LocalDateTime v) { this.createdAt = v; return this; }
        public ServiceFormBuilder updatedAt(LocalDateTime v) { this.updatedAt = v; return this; }

        public ServiceForm build() {
            return new ServiceForm(id, customerName, contactPerson, phone, email, address,
                    serviceDate, arrivalTime, deliveryTime, notification, staffCount,
                    serviceLocation, serviceStatus, faultDescription, serviceDescription,
                    deliveryNotes, customerSignature, technicianSignature, syncStatus,
                    products, technician, createdAt, updatedAt);
        }
    }
}
