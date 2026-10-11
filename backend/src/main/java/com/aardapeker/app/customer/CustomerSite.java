package com.aardapeker.app.customer;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;

import java.util.UUID;

/**
 * One address a customer is served at. Most customers have several
 * (Samandira, Orhanli, Bursa Antrepo...), which is the half of the phrase a
 * technician says after the customer name.
 */
@Entity
@Table(name = "customer_sites")
public class CustomerSite {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "customer_id", nullable = false)
    @JsonBackReference("customer_sites")
    private Customer customer;

    /** Short site name as spoken, e.g. "Samandira". */
    @Column(nullable = false)
    private String label;

    @Column(length = 1024)
    private String address;

    private String contactPerson;
    private String phone;
    private String email;

    @Column(nullable = false)
    private int orderIndex;

    public CustomerSite() {}

    public CustomerSite(UUID id, Customer customer, String label, String address,
                        String contactPerson, String phone, String email, int orderIndex) {
        this.id = id;
        this.customer = customer;
        this.label = label;
        this.address = address;
        this.contactPerson = contactPerson;
        this.phone = phone;
        this.email = email;
        this.orderIndex = orderIndex;
    }

    public UUID getId() { return id; }
    public void setId(UUID v) { this.id = v; }
    public Customer getCustomer() { return customer; }
    public void setCustomer(Customer v) { this.customer = v; }
    public String getLabel() { return label; }
    public void setLabel(String v) { this.label = v; }
    public String getAddress() { return address; }
    public void setAddress(String v) { this.address = v; }
    public String getContactPerson() { return contactPerson; }
    public void setContactPerson(String v) { this.contactPerson = v; }
    public String getPhone() { return phone; }
    public void setPhone(String v) { this.phone = v; }
    public String getEmail() { return email; }
    public void setEmail(String v) { this.email = v; }
    public int getOrderIndex() { return orderIndex; }
    public void setOrderIndex(int v) { this.orderIndex = v; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private UUID id;
        private Customer customer;
        private String label;
        private String address;
        private String contactPerson;
        private String phone;
        private String email;
        private int orderIndex;

        public Builder id(UUID v) { this.id = v; return this; }
        public Builder customer(Customer v) { this.customer = v; return this; }
        public Builder label(String v) { this.label = v; return this; }
        public Builder address(String v) { this.address = v; return this; }
        public Builder contactPerson(String v) { this.contactPerson = v; return this; }
        public Builder phone(String v) { this.phone = v; return this; }
        public Builder email(String v) { this.email = v; return this; }
        public Builder orderIndex(int v) { this.orderIndex = v; return this; }

        public CustomerSite build() {
            return new CustomerSite(id, customer, label, address, contactPerson, phone, email, orderIndex);
        }
    }
}
