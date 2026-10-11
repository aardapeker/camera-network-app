package com.aardapeker.app.model;

import jakarta.persistence.*;

import java.util.Set;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;

@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Entity
@Table(name = "rack_cabins")
public class RackCabin {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private String id;

  @Column(nullable = false)
  private String rackCabinId; // Frontend rack cabin ID

  @Column(nullable = false)
  private String label; // Rack cabin label/name

  @Column(nullable = false)
  private Double positionX; // X coordinate on the map

  @Column(nullable = false)
  private Double positionY; // Y coordinate on the map

  @Column(nullable = false)
  private Integer rotation; // Rotation in degrees

  @Column
  private String color; // Rack cabin color

  @Column(name = "note", columnDefinition = "TEXT")
  private String note; // Rack cabin note

  @Column
  private Boolean flipX; // Horizontal flip

  @Column
  private Boolean flipY; // Vertical flip

  @Column(name = "label_position")
  private String labelPosition; // Label position (top, bottom, left, right)

  // Devices contained inside this rack cabin (NVR, Switch, Router)
  @OneToMany(mappedBy = "rackCabin", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
  @JsonManagedReference("rackCabinDevices")
  private Set<Device> devices;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "topology_id")
  @JsonBackReference("rackCabins")
  private Topology topology;

  // No-arg constructor (required by JPA)
  public RackCabin() {
  }

  // Getters and Setters
  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getRackCabinId() {
    return rackCabinId;
  }

  public void setRackCabinId(String rackCabinId) {
    this.rackCabinId = rackCabinId;
  }

  public String getLabel() {
    return label;
  }

  public void setLabel(String label) {
    this.label = label;
  }

  public Double getPositionX() {
    return positionX;
  }

  public void setPositionX(Double positionX) {
    this.positionX = positionX;
  }

  public Double getPositionY() {
    return positionY;
  }

  public void setPositionY(Double positionY) {
    this.positionY = positionY;
  }

  public Integer getRotation() {
    return rotation;
  }

  public void setRotation(Integer rotation) {
    this.rotation = rotation;
  }

  public String getColor() {
    return color;
  }

  public void setColor(String color) {
    this.color = color;
  }

  public String getNote() {
    return note;
  }

  public void setNote(String note) {
    this.note = note;
  }

  public Boolean getFlipX() {
    return flipX;
  }

  public void setFlipX(Boolean flipX) {
    this.flipX = flipX;
  }

  public Boolean getFlipY() {
    return flipY;
  }

  public void setFlipY(Boolean flipY) {
    this.flipY = flipY;
  }

  public Set<Device> getDevices() {
    return devices;
  }

  public void setDevices(Set<Device> devices) {
    this.devices = devices;
  }

  public Topology getTopology() {
    return topology;
  }

  public void setTopology(Topology topology) {
    this.topology = topology;
  }

  public String getLabelPosition() {
    return labelPosition;
  }

  public void setLabelPosition(String labelPosition) {
    this.labelPosition = labelPosition;
  }
}
