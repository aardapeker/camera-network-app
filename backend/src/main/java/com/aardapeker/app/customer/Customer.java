package com.aardapeker.app.customer;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * A customer the company serves. Technicians rarely say the full registered
 * name - {@code shortName} holds what they actually call it on site ("Barsan"),
 * so a dictated phrase still resolves.
 */
@Entity
@Table(name = "customers")
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    /** What technicians call this customer in speech. Optional. */
    private String shortName;

    @OneToMany(mappedBy = "customer", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderIndex ASC")
    @JsonManagedReference("customer_sites")
    private List<CustomerSite> sites = new ArrayList<>();

    @CreationTimestamp
    private LocalDateTime createdAt;

    public Customer() {}

    public Customer(UUID id, String name, String shortName, List<CustomerSite> sites, LocalDateTime createdAt) {
        this.id = id;
        this.name = name;
        this.shortName = shortName;
        this.sites = sites != null ? sites : new ArrayList<>();
        this.createdAt = createdAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID v) { this.id = v; }
    public String getName() { return name; }
    public void setName(String v) { this.name = v; }
    public String getShortName() { return shortName; }
    public void setShortName(String v) { this.shortName = v; }
    public List<CustomerSite> getSites() { return sites; }
    public void setSites(List<CustomerSite> v) { this.sites = v; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime v) { this.createdAt = v; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private UUID id;
        private String name;
        private String shortName;
        private List<CustomerSite> sites = new ArrayList<>();
        private LocalDateTime createdAt;

        public Builder id(UUID v) { this.id = v; return this; }
        public Builder name(String v) { this.name = v; return this; }
        public Builder shortName(String v) { this.shortName = v; return this; }
        public Builder sites(List<CustomerSite> v) { this.sites = v; return this; }
        public Builder createdAt(LocalDateTime v) { this.createdAt = v; return this; }

        public Customer build() { return new Customer(id, name, shortName, sites, createdAt); }
    }
}
