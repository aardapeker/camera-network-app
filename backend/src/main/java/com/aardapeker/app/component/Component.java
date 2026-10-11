package com.aardapeker.app.component;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "components")
public class Component {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @OneToMany(mappedBy = "component", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderIndex ASC")
    @JsonManagedReference("component_fields")
    private List<ComponentField> fields = new ArrayList<>();

    @CreationTimestamp
    private LocalDateTime createdAt;

    public Component() {}

    public Component(UUID id, String name, List<ComponentField> fields, LocalDateTime createdAt) {
        this.id = id;
        this.name = name;
        this.fields = fields != null ? fields : new ArrayList<>();
        this.createdAt = createdAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public List<ComponentField> getFields() { return fields; }
    public void setFields(List<ComponentField> fields) { this.fields = fields; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private UUID id;
        private String name;
        private List<ComponentField> fields = new ArrayList<>();
        private LocalDateTime createdAt;

        public Builder id(UUID v) { this.id = v; return this; }
        public Builder name(String v) { this.name = v; return this; }
        public Builder fields(List<ComponentField> v) { this.fields = v; return this; }
        public Builder createdAt(LocalDateTime v) { this.createdAt = v; return this; }

        public Component build() {
            return new Component(id, name, fields, createdAt);
        }
    }
}
