package com.aardapeker.app.model;

import jakarta.persistence.*;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Entity
@Table(name = "devices")
public class Device {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private String id;

  @Column(nullable = false)
  private String deviceId; // Frontend device ID

  @Column(nullable = false)
  private String deviceType; // camera, switch, nvr, router, access_point, ups, horn_speaker

  @Column(nullable = false)
  private String label; // Device label

  @Column(nullable = false)
  private Double positionX; // X coordinate

  @Column(nullable = false)
  private Double positionY; // Y coordinate

  @Column(nullable = false)
  private Integer rotation; // Rotation in degrees

  @Column
  private String color; // Device color

  @Column(name = "note", columnDefinition = "TEXT")
  private String note; // Device note

  @Column
  private Boolean flipX; // Horizontal flip

  @Column
  private Boolean flipY; // Vertical flip

  @Column(name = "ip_address")
  private String ipAddress; // Device IP address (default: 192.168.1.1)

  @Column
  private String brand;

  @Column
  private String model;

  @Column(name = "serial_number")
  private String serialNumber;

  @Column(name = "subtype")
  private String subtype;

  @Column(name = "device_picture_url")
  private String devicePictureUrl;

  @Column(name = "order_index")
  private Integer orderIndex;

  @Column(name = "label_position")
  private String labelPosition; // Label position (top, bottom, left, right)

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "topology_id")
  @JsonBackReference("devices")
  private Topology topology;

  // Optional: Device can be inside a RackCabin
  @ManyToOne(fetch = FetchType.EAGER)
  @JoinColumn(name = "rack_cabin_id")
  @JsonBackReference("rackCabinDevices")
  private RackCabin rackCabin;

  // No-arg constructor (required by JPA)
  public Device() {
  }

  // Getters and Setters
  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getDeviceId() {
    return deviceId;
  }

  public void setDeviceId(String deviceId) {
    this.deviceId = deviceId;
  }

  public String getDeviceType() {
    return deviceType;
  }

  public void setDeviceType(String deviceType) {
    this.deviceType = deviceType;
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

  public String getIpAddress() {
    return ipAddress;
  }

  public void setIpAddress(String ipAddress) {
    this.ipAddress = ipAddress;
  }

  public String getBrand() {
    return brand;
  }

  public void setBrand(String brand) {
    this.brand = brand;
  }

  public String getModel() {
    return model;
  }

  public void setModel(String model) {
    this.model = model;
  }

  public String getSerialNumber() {
    return serialNumber;
  }

  public void setSerialNumber(String serialNumber) {
    this.serialNumber = serialNumber;
  }

  public String getSubtype() {
    return subtype;
  }

  public void setSubtype(String subtype) {
    this.subtype = subtype;
  }

  public String getDevicePictureUrl() {
    return devicePictureUrl;
  }

  public void setDevicePictureUrl(String devicePictureUrl) {
    this.devicePictureUrl = devicePictureUrl;
  }

  public Topology getTopology() {
    return topology;
  }

  public void setTopology(Topology topology) {
    this.topology = topology;
  }

  public RackCabin getRackCabin() {
    return rackCabin;
  }

  public void setRackCabin(RackCabin rackCabin) {
    this.rackCabin = rackCabin;
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

  // Expose rackCabinId for JSON serialization (so frontend can filter devices in rack cabins)
  public String getRackCabinId() {
    return rackCabin != null ? rackCabin.getRackCabinId() : null;
  }
}
