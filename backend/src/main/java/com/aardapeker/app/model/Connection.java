package com.aardapeker.app.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonBackReference;

@Entity
@Table(name = "connections")
public class Connection {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private String id;

  @Column(name = "source_device_id", nullable = false)
  private String sourceDeviceId;

  @Column(name = "target_device_id", nullable = false)
  private String targetDeviceId;

  @Column
  private String color;

  @Column(name = "line_type")
  private String lineType;

  @Column(name = "source_port")
  private Integer sourcePort;

  @Column(name = "target_port")
  private Integer targetPort;

  @Column(name = "source_internal_device_id")
  private String sourceInternalDeviceId;

  @Column(name = "target_internal_device_id")
  private String targetInternalDeviceId;

  @Column
  private String name;

  @Column(columnDefinition = "TEXT")
  private String waypoints;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "topology_id")
  @JsonBackReference("connections")
  public Topology topology;

  // No-arg constructor (required by JPA)
  public Connection() {
  }

  public Connection(String sourceDeviceId, String targetDeviceId, String color) {
    this.sourceDeviceId = sourceDeviceId;
    this.targetDeviceId = targetDeviceId;
    this.color = color;
  }

  // Getters and Setters
  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getSourceDeviceId() {
    return sourceDeviceId;
  }

  public void setSourceDeviceId(String sourceDeviceId) {
    this.sourceDeviceId = sourceDeviceId;
  }

  public String getTargetDeviceId() {
    return targetDeviceId;
  }

  public void setTargetDeviceId(String targetDeviceId) {
    this.targetDeviceId = targetDeviceId;
  }

  public String getColor() {
    return color;
  }

  public void setColor(String color) {
    this.color = color;
  }

  public String getLineType() {
    return lineType;
  }

  public void setLineType(String lineType) {
    this.lineType = lineType;
  }

  public Integer getSourcePort() {
    return sourcePort;
  }

  public void setSourcePort(Integer sourcePort) {
    this.sourcePort = sourcePort;
  }

  public Integer getTargetPort() {
    return targetPort;
  }

  public void setTargetPort(Integer targetPort) {
    this.targetPort = targetPort;
  }

  public String getSourceInternalDeviceId() {
    return sourceInternalDeviceId;
  }

  public void setSourceInternalDeviceId(String sourceInternalDeviceId) {
    this.sourceInternalDeviceId = sourceInternalDeviceId;
  }

  public String getTargetInternalDeviceId() {
    return targetInternalDeviceId;
  }

  public void setTargetInternalDeviceId(String targetInternalDeviceId) {
    this.targetInternalDeviceId = targetInternalDeviceId;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getWaypoints() {
    return waypoints;
  }

  public void setWaypoints(String waypoints) {
    this.waypoints = waypoints;
  }

  public Topology getTopology() {
    return topology;
  }

  public void setTopology(Topology topology) {
    this.topology = topology;
  }
}
