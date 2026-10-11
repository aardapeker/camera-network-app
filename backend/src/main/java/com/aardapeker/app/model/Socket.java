package com.aardapeker.app.model;

import jakarta.persistence.*;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Entity
@Table(name = "sockets")
public class Socket {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private String id;

  @Column(nullable = false)
  private String socketId; // Frontend socket ID

  @Column(nullable = false)
  private String socketType; // ups, cat6, normal, etc.

  @Column(nullable = false)
  private String label; // Socket label/name

  @Column
  private String color; // Socket color (red for UPS, white for normal, etc.)

  @Column(name = "note", columnDefinition = "TEXT")
  private String note; // Socket note

  // Position within the workstation (relative or slot number)
  @Column
  private Integer slotNumber; // Position slot in the workstation

  @Column(name = "order_index")
  private Integer orderIndex;

  @Column(name = "label_position")
  private String labelPosition; // Label position (top, bottom, left, right)

  // Position for standalone sockets (on the map)
  @Column(name = "position_x")
  private Double positionX;

  @Column(name = "position_y")
  private Double positionY;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "workstation_id")
  @JsonBackReference("workstationSockets")
  private Workstation workstation;

  // Direct relationship to topology for standalone sockets
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "topology_id")
  @JsonBackReference("standaloneSockets")
  private Topology topology;

  // No-arg constructor (required by JPA)
  public Socket() {
  }

  // Getters and Setters
  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getSocketId() {
    return socketId;
  }

  public void setSocketId(String socketId) {
    this.socketId = socketId;
  }

  public String getSocketType() {
    return socketType;
  }

  public void setSocketType(String socketType) {
    this.socketType = socketType;
  }

  public String getLabel() {
    return label;
  }

  public void setLabel(String label) {
    this.label = label;
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

  public Integer getSlotNumber() {
    return slotNumber;
  }

  public void setSlotNumber(Integer slotNumber) {
    this.slotNumber = slotNumber;
  }

  public Workstation getWorkstation() {
    return workstation;
  }

  public void setWorkstation(Workstation workstation) {
    this.workstation = workstation;
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

  public Topology getTopology() {
    return topology;
  }

  public void setTopology(Topology topology) {
    this.topology = topology;
  }

  public Integer getOrderIndex() {
    return orderIndex;
  }

  public void setOrderIndex(Integer orderIndex) {
    this.orderIndex = orderIndex;
  }

  public String getLabelPosition() {
    return labelPosition;
  }

  public void setLabelPosition(String labelPosition) {
    this.labelPosition = labelPosition;
  }
}
