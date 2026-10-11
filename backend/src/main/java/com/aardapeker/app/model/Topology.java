package com.aardapeker.app.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.Set;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import java.util.HashSet;

@Entity
@Table(name = "topologies")
public class Topology {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private String id;

  @Column(nullable = false)
  private String name;

  @Column(name = "blueprint_picture_url", nullable = true)
  private String blueprintPictureUrl;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt;

  // Devices (Camera, Switch, NVR, Router, Access Point) - standalone on the map
  @OneToMany(mappedBy = "topology", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
  @JsonManagedReference("devices")
  private Set<Device> devices;

  // Rack Cabins (can contain NVR, Switch, Router inside)
  @OneToMany(mappedBy = "topology", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
  @JsonManagedReference("rackCabins")
  private Set<RackCabin> rackCabins;

  // Workstations (can contain sockets: UPS, CAT6, normal)
  @OneToMany(mappedBy = "topology", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
  @JsonManagedReference("workstations")
  private Set<Workstation> workstations;

  // Connections between devices/infrastructure
  @OneToMany(mappedBy = "topology", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
  @JsonManagedReference("connections")
  private Set<Connection> connections;

  // Standalone sockets (not attached to workstations)
  @OneToMany(mappedBy = "topology", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
  @JsonManagedReference("standaloneSockets")
  private Set<Socket> sockets;

  @ManyToMany(fetch = FetchType.LAZY)
  @JoinTable(
      name = "topology_clients",
      joinColumns = @JoinColumn(name = "topology_id"),
      inverseJoinColumns = @JoinColumn(name = "user_id")
  )
  private Set<User> clients;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "created_by_id", updatable = false)
  @JsonBackReference("createdTopologies")
  private User createdBy;

  // Per-project device naming/IP defaults. Prefix null = fall back to the user's Settings default.
  @Column(name = "camera_prefix")
  private String cameraPrefix;
  @Column(name = "camera_start_number")
  private Integer cameraStartNumber;
  @Column(name = "camera_start_ip")
  private String cameraStartIp;

  @Column(name = "switch_prefix")
  private String switchPrefix;
  @Column(name = "switch_start_number")
  private Integer switchStartNumber;
  @Column(name = "switch_start_ip")
  private String switchStartIp;

  @Column(name = "nvr_prefix")
  private String nvrPrefix;
  @Column(name = "nvr_start_number")
  private Integer nvrStartNumber;
  @Column(name = "nvr_start_ip")
  private String nvrStartIp;

  @Column(name = "router_prefix")
  private String routerPrefix;
  @Column(name = "router_start_number")
  private Integer routerStartNumber;
  @Column(name = "router_start_ip")
  private String routerStartIp;

  @Column(name = "access_point_prefix")
  private String accessPointPrefix;
  @Column(name = "access_point_start_number")
  private Integer accessPointStartNumber;
  @Column(name = "access_point_start_ip")
  private String accessPointStartIp;

  @Column(name = "ups_prefix")
  private String upsPrefix;
  @Column(name = "ups_start_number")
  private Integer upsStartNumber;
  @Column(name = "ups_start_ip")
  private String upsStartIp;

  @Column(name = "horn_speaker_prefix")
  private String hornSpeakerPrefix;
  @Column(name = "horn_speaker_start_number")
  private Integer hornSpeakerStartNumber;
  @Column(name = "horn_speaker_start_ip")
  private String hornSpeakerStartIp;

  // No-arg constructor (required by JPA)
  public Topology() {
  }

  public Topology(String id, String name, String blueprintPictureUrl, Set<Device> devices) {
    this.id = id;
    this.name = name;
    this.blueprintPictureUrl = blueprintPictureUrl;
    this.devices = devices;
  }

  // Getters and Setters
  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getBlueprintPictureUrl() {
    return blueprintPictureUrl;
  }

  public void setBlueprintPictureUrl(String blueprintPictureUrl) {
    this.blueprintPictureUrl = blueprintPictureUrl;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(LocalDateTime createdAt) {
    this.createdAt = createdAt;
  }

  public LocalDateTime getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(LocalDateTime updatedAt) {
    this.updatedAt = updatedAt;
  }

  public Set<Device> getDevices() {
    return devices;
  }

  public void setDevices(Set<Device> devices) {
    this.devices = devices;
  }

  public Set<RackCabin> getRackCabins() {
    return rackCabins;
  }

  public void setRackCabins(Set<RackCabin> rackCabins) {
    this.rackCabins = rackCabins;
  }

  public Set<Workstation> getWorkstations() {
    return workstations;
  }

  public void setWorkstations(Set<Workstation> workstations) {
    this.workstations = workstations;
  }

  public Set<Connection> getConnections() {
    return connections;
  }

  public void setConnections(Set<Connection> connections) {
    this.connections = connections;
  }

  public Set<Socket> getSockets() {
    return sockets;
  }

  public void setSockets(Set<Socket> sockets) {
    this.sockets = sockets;
  }

  public Set<User> getClients() {
    return clients;
  }

  public void setClients(Set<User> clients) {
    this.clients = clients;
  }

  public void addClient(User client) {
    if (this.clients == null) this.clients = new HashSet<>();
    this.clients.add(client);
  }

  public void removeClient(User client) {
    if (this.clients != null) this.clients.remove(client);
  }

  public User getCreatedBy() {
    return createdBy;
  }

  public void setCreatedBy(User createdBy) {
    this.createdBy = createdBy;
  }

  public String getCameraPrefix() { return cameraPrefix; }
  public void setCameraPrefix(String cameraPrefix) { this.cameraPrefix = cameraPrefix; }

  public Integer getCameraStartNumber() { return cameraStartNumber; }
  public void setCameraStartNumber(Integer cameraStartNumber) { this.cameraStartNumber = cameraStartNumber; }

  public String getCameraStartIp() { return cameraStartIp; }
  public void setCameraStartIp(String cameraStartIp) { this.cameraStartIp = cameraStartIp; }

  public String getSwitchPrefix() { return switchPrefix; }
  public void setSwitchPrefix(String switchPrefix) { this.switchPrefix = switchPrefix; }

  public Integer getSwitchStartNumber() { return switchStartNumber; }
  public void setSwitchStartNumber(Integer switchStartNumber) { this.switchStartNumber = switchStartNumber; }

  public String getSwitchStartIp() { return switchStartIp; }
  public void setSwitchStartIp(String switchStartIp) { this.switchStartIp = switchStartIp; }

  public String getNvrPrefix() { return nvrPrefix; }
  public void setNvrPrefix(String nvrPrefix) { this.nvrPrefix = nvrPrefix; }

  public Integer getNvrStartNumber() { return nvrStartNumber; }
  public void setNvrStartNumber(Integer nvrStartNumber) { this.nvrStartNumber = nvrStartNumber; }

  public String getNvrStartIp() { return nvrStartIp; }
  public void setNvrStartIp(String nvrStartIp) { this.nvrStartIp = nvrStartIp; }

  public String getRouterPrefix() { return routerPrefix; }
  public void setRouterPrefix(String routerPrefix) { this.routerPrefix = routerPrefix; }

  public Integer getRouterStartNumber() { return routerStartNumber; }
  public void setRouterStartNumber(Integer routerStartNumber) { this.routerStartNumber = routerStartNumber; }

  public String getRouterStartIp() { return routerStartIp; }
  public void setRouterStartIp(String routerStartIp) { this.routerStartIp = routerStartIp; }

  public String getAccessPointPrefix() { return accessPointPrefix; }
  public void setAccessPointPrefix(String accessPointPrefix) { this.accessPointPrefix = accessPointPrefix; }

  public Integer getAccessPointStartNumber() { return accessPointStartNumber; }
  public void setAccessPointStartNumber(Integer accessPointStartNumber) { this.accessPointStartNumber = accessPointStartNumber; }

  public String getAccessPointStartIp() { return accessPointStartIp; }
  public void setAccessPointStartIp(String accessPointStartIp) { this.accessPointStartIp = accessPointStartIp; }

  public String getUpsPrefix() { return upsPrefix; }
  public void setUpsPrefix(String upsPrefix) { this.upsPrefix = upsPrefix; }

  public Integer getUpsStartNumber() { return upsStartNumber; }
  public void setUpsStartNumber(Integer upsStartNumber) { this.upsStartNumber = upsStartNumber; }

  public String getUpsStartIp() { return upsStartIp; }
  public void setUpsStartIp(String upsStartIp) { this.upsStartIp = upsStartIp; }

  public String getHornSpeakerPrefix() { return hornSpeakerPrefix; }
  public void setHornSpeakerPrefix(String hornSpeakerPrefix) { this.hornSpeakerPrefix = hornSpeakerPrefix; }

  public Integer getHornSpeakerStartNumber() { return hornSpeakerStartNumber; }
  public void setHornSpeakerStartNumber(Integer hornSpeakerStartNumber) { this.hornSpeakerStartNumber = hornSpeakerStartNumber; }

  public String getHornSpeakerStartIp() { return hornSpeakerStartIp; }
  public void setHornSpeakerStartIp(String hornSpeakerStartIp) { this.hornSpeakerStartIp = hornSpeakerStartIp; }
}
