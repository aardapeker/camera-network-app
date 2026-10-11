package com.aardapeker.app.service.impl;

import com.aardapeker.app.dto.request.SaveTopologyRequest;
import com.aardapeker.app.dto.request.SaveTopologyRequest.DeviceDto;
import com.aardapeker.app.dto.request.SaveTopologyRequest.RackCabinDto;
import com.aardapeker.app.dto.request.SaveTopologyRequest.WorkstationDto;
import com.aardapeker.app.exception.ResourceNotFoundException;
import com.aardapeker.app.model.Connection;
import com.aardapeker.app.model.Device;
import com.aardapeker.app.model.RackCabin;
import com.aardapeker.app.model.Role;
import com.aardapeker.app.model.Socket;
import com.aardapeker.app.model.Topology;
import com.aardapeker.app.model.User;
import com.aardapeker.app.model.Workstation;
import com.aardapeker.app.repository.TopologyRepository;
import com.aardapeker.app.repository.UserRepository;
import com.aardapeker.app.service.TopologyService;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TopologyServiceImpl implements TopologyService {

    private final UserRepository userRepository;
    private final TopologyRepository topologyRepository;

    public TopologyServiceImpl(
            UserRepository userRepository,
            TopologyRepository topologyRepository) {
        this.userRepository = userRepository;
        this.topologyRepository = topologyRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<User> getClients() {
        return userRepository.findByAuthoritiesContaining(Role.ROLE_CLIENT);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Topology> getTopologiesByClient(String clientUsername) {
        return topologyRepository.findByClientUsername(clientUsername);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Topology> getAllTopologies() {
        return topologyRepository.findAllWithDetails();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Topology> getUnassignedTopologies() {
        return topologyRepository.findUnassigned();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Topology> getUnassignedTopologiesByCreator(String creatorUsername) {
        return topologyRepository.findUnassignedByCreatorUsername(creatorUsername);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Topology> getAssignedTopologies() {
        return topologyRepository.findAllAssigned();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Topology> getTopologiesByCreator(String creatorUsername) {
        return topologyRepository.findByCreatorUsername(creatorUsername);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Topology> getAllTopologies(String search, String sortBy, String sortDirection, String assignedFilter, String creatorFilter) {
        List<Topology> topologies = topologyRepository.findAllWithDetails();
        return applyFiltersAndSort(topologies, search, sortBy, sortDirection, assignedFilter, creatorFilter);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Topology> getTopologiesByCreator(String creatorUsername, String search, String sortBy, String sortDirection) {
        List<Topology> topologies = topologyRepository.findByCreatorUsername(creatorUsername);
        return applyFiltersAndSort(topologies, search, sortBy, sortDirection, null, null);
    }

    private List<Topology> applyFiltersAndSort(List<Topology> topologies, String search, String sortBy, String sortDirection, String assignedFilter, String creatorFilter) {
        Stream<Topology> stream = topologies.stream();

        // Filter by name search
        if (search != null && !search.isBlank()) {
            String lower = search.toLowerCase();
            stream = stream.filter(t -> t.getName() != null && t.getName().toLowerCase().contains(lower));
        }

        // Filter by assignment status (all | assigned | unassigned)
        if ("assigned".equalsIgnoreCase(assignedFilter)) {
            stream = stream.filter(t -> t.getClients() != null && !t.getClients().isEmpty());
        } else if ("unassigned".equalsIgnoreCase(assignedFilter)) {
            stream = stream.filter(t -> t.getClients() == null || t.getClients().isEmpty());
        }

        // Filter by creator username
        if (creatorFilter != null && !creatorFilter.isBlank()) {
            String lower = creatorFilter.toLowerCase();
            stream = stream.filter(t -> t.getCreatedBy() != null
                    && t.getCreatedBy().getUsername().toLowerCase().contains(lower));
        }

        // Sort
        Comparator<Topology> comparator;
        if ("updatedAt".equals(sortBy)) {
            comparator = Comparator.comparing(t -> t.getUpdatedAt() != null ? t.getUpdatedAt() : t.getCreatedAt());
        } else if ("name".equals(sortBy)) {
            comparator = Comparator.comparing(t -> t.getName() != null ? t.getName().toLowerCase() : "");
        } else {
            // Default: createdAt
            comparator = Comparator.comparing(Topology::getCreatedAt);
        }

        if ("ASC".equalsIgnoreCase(sortDirection)) {
            stream = stream.sorted(comparator);
        } else {
            stream = stream.sorted(comparator.reversed());
        }

        return stream.collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Topology getTopologyById(String topologyId) {
        return topologyRepository.findByIdWithDetails(topologyId)
                .orElseThrow(() -> new ResourceNotFoundException("Topology not found: " + topologyId));
    }

    @Override
    @Transactional
    public Topology createTopology(SaveTopologyRequest request, User createdBy) {
        Topology topology = new Topology();
        topology.setName(request.name() != null ? request.name() : "Topology-" + System.currentTimeMillis());
        topology.setBlueprintPictureUrl(request.blueprintPictureUrl());
        topology.setCreatedBy(createdBy);
        applyDeviceDefaults(topology, request);

        // clientUsernames is optional — TECH users can create unassigned topologies
        if (request.clientUsernames() != null && !request.clientUsernames().isEmpty()) {
            Set<User> clients = resolveClients(request.clientUsernames());
            topology.setClients(clients);
        }

        Map<String, RackCabin> rackCabinMap = new HashMap<>();
        processRackCabins(request, topology, rackCabinMap);
        processDevices(request, topology, rackCabinMap);
        processWorkstations(request, topology);
        processStandaloneSockets(request, topology);
        processConnections(request, topology);

        return topologyRepository.save(topology);
    }

    @Override
    @Transactional
    public Topology updateTopology(String topologyId, SaveTopologyRequest request) {
        Topology topology = topologyRepository.findByIdWithDetails(topologyId)
                .orElseThrow(() -> new ResourceNotFoundException("Topology not found: " + topologyId));

        updateBasicFields(topology, request);
        clearExistingEntities(topology);

        Map<String, RackCabin> rackCabinMap = new HashMap<>();
        processRackCabins(request, topology, rackCabinMap);
        processDevices(request, topology, rackCabinMap);
        processWorkstations(request, topology);
        processStandaloneSockets(request, topology);
        processConnections(request, topology);

        return topologyRepository.save(topology);
    }

    @Override
    @Transactional
    public void deleteTopology(String topologyId) {
        Topology topology = topologyRepository.findById(topologyId)
                .orElseThrow(() -> new ResourceNotFoundException("Topology not found: " + topologyId));

        topologyRepository.delete(topology);
    }

    @Override
    @Transactional
    public Topology duplicateTopology(String topologyId, User createdBy) {
        Topology original = topologyRepository.findByIdWithDetails(topologyId)
                .orElseThrow(() -> new ResourceNotFoundException("Topology not found: " + topologyId));

        Topology duplicate = new Topology();
        duplicate.setName(original.getName() + " (Copy)");
        duplicate.setBlueprintPictureUrl(original.getBlueprintPictureUrl());
        if (original.getClients() != null) {
            duplicate.setClients(new HashSet<>(original.getClients()));
        }
        duplicate.setCreatedBy(createdBy);
        duplicate.setCameraPrefix(original.getCameraPrefix());
        duplicate.setCameraStartNumber(original.getCameraStartNumber());
        duplicate.setCameraStartIp(original.getCameraStartIp());
        duplicate.setSwitchPrefix(original.getSwitchPrefix());
        duplicate.setSwitchStartNumber(original.getSwitchStartNumber());
        duplicate.setSwitchStartIp(original.getSwitchStartIp());
        duplicate.setNvrPrefix(original.getNvrPrefix());
        duplicate.setNvrStartNumber(original.getNvrStartNumber());
        duplicate.setNvrStartIp(original.getNvrStartIp());
        duplicate.setRouterPrefix(original.getRouterPrefix());
        duplicate.setRouterStartNumber(original.getRouterStartNumber());
        duplicate.setRouterStartIp(original.getRouterStartIp());
        duplicate.setAccessPointPrefix(original.getAccessPointPrefix());
        duplicate.setAccessPointStartNumber(original.getAccessPointStartNumber());
        duplicate.setAccessPointStartIp(original.getAccessPointStartIp());
        duplicate.setUpsPrefix(original.getUpsPrefix());
        duplicate.setUpsStartNumber(original.getUpsStartNumber());
        duplicate.setUpsStartIp(original.getUpsStartIp());
        duplicate.setHornSpeakerPrefix(original.getHornSpeakerPrefix());
        duplicate.setHornSpeakerStartNumber(original.getHornSpeakerStartNumber());
        duplicate.setHornSpeakerStartIp(original.getHornSpeakerStartIp());

        // Deep copy rack cabins and build a map of original deviceId -> new deviceId for connection remapping
        Map<String, String> deviceIdMap = new HashMap<>();
        if (original.getRackCabins() != null && !original.getRackCabins().isEmpty()) {
            Set<RackCabin> duplicateRackCabins = new HashSet<>();
            for (RackCabin originalRc : original.getRackCabins()) {
                RackCabin newRc = new RackCabin();
                String newRackCabinId = UUID.randomUUID().toString();
                newRc.setRackCabinId(newRackCabinId);
                newRc.setLabel(originalRc.getLabel());
                newRc.setPositionX(originalRc.getPositionX());
                newRc.setPositionY(originalRc.getPositionY());
                newRc.setRotation(originalRc.getRotation());
                newRc.setColor(originalRc.getColor());
                newRc.setNote(originalRc.getNote());
                newRc.setFlipX(originalRc.getFlipX());
                newRc.setFlipY(originalRc.getFlipY());
                newRc.setLabelPosition(originalRc.getLabelPosition());
                newRc.setTopology(duplicate);

                if (originalRc.getDevices() != null && !originalRc.getDevices().isEmpty()) {
                    Set<Device> newInnerDevices = new HashSet<>();
                    for (Device originalDev : originalRc.getDevices()) {
                        Device newDev = copyDevice(originalDev, duplicate, newRc);
                        deviceIdMap.put(originalDev.getDeviceId(), newDev.getDeviceId());
                        newInnerDevices.add(newDev);
                    }
                    newRc.setDevices(newInnerDevices);
                }

                duplicateRackCabins.add(newRc);
            }
            duplicate.setRackCabins(duplicateRackCabins);
        }

        // Deep copy standalone devices (skip those already handled inside rack cabins)
        if (original.getDevices() != null && !original.getDevices().isEmpty()) {
            Set<Device> duplicateDevices = new HashSet<>();
            for (Device originalDev : original.getDevices()) {
                if (originalDev.getRackCabin() != null) {
                    // Already duplicated as part of its rack cabin above
                    continue;
                }
                Device newDev = copyDevice(originalDev, duplicate, null);
                deviceIdMap.put(originalDev.getDeviceId(), newDev.getDeviceId());
                duplicateDevices.add(newDev);
            }
            duplicate.setDevices(duplicateDevices);
        }

        // Deep copy workstations with their sockets
        if (original.getWorkstations() != null && !original.getWorkstations().isEmpty()) {
            Set<Workstation> duplicateWorkstations = new HashSet<>();
            for (Workstation originalWs : original.getWorkstations()) {
                Workstation newWs = new Workstation();
                String newWorkstationId = UUID.randomUUID().toString();
                newWs.setWorkstationId(newWorkstationId);
                newWs.setLabel(originalWs.getLabel());
                newWs.setPositionX(originalWs.getPositionX());
                newWs.setPositionY(originalWs.getPositionY());
                newWs.setRotation(originalWs.getRotation());
                newWs.setColor(originalWs.getColor());
                newWs.setNote(originalWs.getNote());
                newWs.setFlipX(originalWs.getFlipX());
                newWs.setFlipY(originalWs.getFlipY());
                newWs.setLabelPosition(originalWs.getLabelPosition());
                newWs.setTopology(duplicate);

                if (originalWs.getSockets() != null && !originalWs.getSockets().isEmpty()) {
                    Set<Socket> newSockets = new HashSet<>();
                    for (Socket originalSocket : originalWs.getSockets()) {
                        Socket newSocket = copySocket(originalSocket, newWs);
                        newSockets.add(newSocket);
                    }
                    newWs.setSockets(newSockets);
                }

                duplicateWorkstations.add(newWs);
            }
            duplicate.setWorkstations(duplicateWorkstations);
        }

        // Deep copy standalone sockets
        if (original.getSockets() != null && !original.getSockets().isEmpty()) {
            Set<Socket> duplicateSockets = new HashSet<>();
            for (Socket originalSocket : original.getSockets()) {
                Socket newSocket = new Socket();
                newSocket.setSocketId(UUID.randomUUID().toString());
                newSocket.setSocketType(originalSocket.getSocketType());
                newSocket.setLabel(originalSocket.getLabel());
                newSocket.setPositionX(originalSocket.getPositionX());
                newSocket.setPositionY(originalSocket.getPositionY());
                newSocket.setColor(originalSocket.getColor());
                newSocket.setNote(originalSocket.getNote());
                newSocket.setSlotNumber(originalSocket.getSlotNumber());
                newSocket.setOrderIndex(originalSocket.getOrderIndex());
                newSocket.setLabelPosition(originalSocket.getLabelPosition());
                newSocket.setTopology(duplicate);
                duplicateSockets.add(newSocket);
            }
            duplicate.setSockets(duplicateSockets);
        }

        // Deep copy connections with remapped device IDs
        if (original.getConnections() != null && !original.getConnections().isEmpty()) {
            Set<Connection> duplicateConnections = new HashSet<>();
            for (Connection originalConn : original.getConnections()) {
                Connection newConn = new Connection();
                newConn.setSourceDeviceId(
                        deviceIdMap.getOrDefault(originalConn.getSourceDeviceId(), originalConn.getSourceDeviceId()));
                newConn.setTargetDeviceId(
                        deviceIdMap.getOrDefault(originalConn.getTargetDeviceId(), originalConn.getTargetDeviceId()));
                newConn.setColor(originalConn.getColor());
                newConn.setLineType(originalConn.getLineType());
                newConn.setSourcePort(originalConn.getSourcePort());
                newConn.setTargetPort(originalConn.getTargetPort());
                newConn.setSourceInternalDeviceId(
                        deviceIdMap.getOrDefault(originalConn.getSourceInternalDeviceId(),
                                originalConn.getSourceInternalDeviceId()));
                newConn.setTargetInternalDeviceId(
                        deviceIdMap.getOrDefault(originalConn.getTargetInternalDeviceId(),
                                originalConn.getTargetInternalDeviceId()));
                newConn.setName(originalConn.getName());
                newConn.setWaypoints(originalConn.getWaypoints());
                newConn.setTopology(duplicate);
                duplicateConnections.add(newConn);
            }
            duplicate.setConnections(duplicateConnections);
        }

        return topologyRepository.save(duplicate);
    }

    private Device copyDevice(Device original, Topology newTopology, RackCabin newRackCabin) {
        Device device = new Device();
        device.setDeviceId(UUID.randomUUID().toString());
        device.setDeviceType(original.getDeviceType());
        device.setLabel(original.getLabel());
        device.setPositionX(original.getPositionX());
        device.setPositionY(original.getPositionY());
        device.setRotation(original.getRotation());
        device.setColor(original.getColor());
        device.setNote(original.getNote());
        device.setFlipX(original.getFlipX());
        device.setFlipY(original.getFlipY());
        device.setIpAddress(original.getIpAddress());
        device.setOrderIndex(original.getOrderIndex());
        device.setLabelPosition(original.getLabelPosition());
        device.setBrand(original.getBrand());
        device.setModel(original.getModel());
        device.setSerialNumber(original.getSerialNumber());
        device.setSubtype(original.getSubtype());
        device.setTopology(newTopology);
        device.setRackCabin(newRackCabin);
        return device;
    }

    private Socket copySocket(Socket original, Workstation newWorkstation) {
        Socket socket = new Socket();
        socket.setSocketId(UUID.randomUUID().toString());
        socket.setSocketType(original.getSocketType());
        socket.setLabel(original.getLabel());
        socket.setColor(original.getColor());
        socket.setNote(original.getNote());
        socket.setSlotNumber(original.getSlotNumber());
        socket.setOrderIndex(original.getOrderIndex());
        socket.setLabelPosition(original.getLabelPosition());
        socket.setWorkstation(newWorkstation);
        return socket;
    }

    @Override
    @Transactional
    public Topology unassignTopology(String topologyId) {
        Topology topology = topologyRepository.findById(topologyId)
                .orElseThrow(() -> new ResourceNotFoundException("Topology not found: " + topologyId));
        topology.setClients(new HashSet<>());
        return topologyRepository.save(topology);
    }

    private void updateBasicFields(Topology topology, SaveTopologyRequest request) {
        if (request.name() != null) {
            topology.setName(request.name());
        }
        if (request.blueprintPictureUrl() != null) {
            topology.setBlueprintPictureUrl(request.blueprintPictureUrl());
        }
        // clientUsernames is optional — only update if provided
        if (request.clientUsernames() != null) {
            topology.setClients(resolveClients(request.clientUsernames()));
        }
        applyDeviceDefaults(topology, request);
    }

    private void applyDeviceDefaults(Topology topology, SaveTopologyRequest request) {
        topology.setCameraPrefix(request.cameraPrefix());
        topology.setCameraStartNumber(request.cameraStartNumber());
        topology.setCameraStartIp(request.cameraStartIp());
        topology.setSwitchPrefix(request.switchPrefix());
        topology.setSwitchStartNumber(request.switchStartNumber());
        topology.setSwitchStartIp(request.switchStartIp());
        topology.setNvrPrefix(request.nvrPrefix());
        topology.setNvrStartNumber(request.nvrStartNumber());
        topology.setNvrStartIp(request.nvrStartIp());
        topology.setRouterPrefix(request.routerPrefix());
        topology.setRouterStartNumber(request.routerStartNumber());
        topology.setRouterStartIp(request.routerStartIp());
        topology.setAccessPointPrefix(request.accessPointPrefix());
        topology.setAccessPointStartNumber(request.accessPointStartNumber());
        topology.setAccessPointStartIp(request.accessPointStartIp());
        topology.setUpsPrefix(request.upsPrefix());
        topology.setUpsStartNumber(request.upsStartNumber());
        topology.setUpsStartIp(request.upsStartIp());
        topology.setHornSpeakerPrefix(request.hornSpeakerPrefix());
        topology.setHornSpeakerStartNumber(request.hornSpeakerStartNumber());
        topology.setHornSpeakerStartIp(request.hornSpeakerStartIp());
    }

    private Set<User> resolveClients(List<String> usernames) {
        return usernames.stream()
                .filter(u -> u != null && !u.isBlank())
                .map(username -> userRepository.findByUsername(username)
                        .orElseThrow(() -> new ResourceNotFoundException("Client not found: " + username)))
                .collect(Collectors.toSet());
    }

    private void clearExistingEntities(Topology topology) {
        if (topology.getDevices() != null) {
            topology.getDevices().clear();
        }
        if (topology.getRackCabins() != null) {
            topology.getRackCabins().clear();
        }
        if (topology.getWorkstations() != null) {
            topology.getWorkstations().clear();
        }
        if (topology.getSockets() != null) {
            topology.getSockets().clear();
        }
        if (topology.getConnections() != null) {
            topology.getConnections().clear();
        }
    }

    private void processRackCabins(SaveTopologyRequest request, Topology topology,
            Map<String, RackCabin> rackCabinMap) {
        if (request.rackCabins() == null || request.rackCabins().isEmpty()) {
            return;
        }

        Set<RackCabin> rackCabins = request.rackCabins().stream()
                .map(dto -> mapRackCabin(dto, topology, rackCabinMap))
                .collect(Collectors.toSet());

        if (topology.getRackCabins() == null) {
            topology.setRackCabins(rackCabins);
        } else {
            topology.getRackCabins().addAll(rackCabins);
        }
    }

    private RackCabin mapRackCabin(RackCabinDto dto, Topology topology,
            Map<String, RackCabin> rackCabinMap) {
        RackCabin rackCabin = new RackCabin();
        rackCabin.setRackCabinId(dto.rackCabinId());
        rackCabin.setLabel(dto.label());
        rackCabin.setPositionX(dto.positionX());
        rackCabin.setPositionY(dto.positionY());
        rackCabin.setRotation(dto.rotation());
        rackCabin.setColor(dto.color());
        rackCabin.setNote(dto.note());
        rackCabin.setFlipX(dto.flipX());
        rackCabin.setFlipY(dto.flipY());
        rackCabin.setLabelPosition(dto.labelPosition());
        rackCabin.setTopology(topology);

        rackCabinMap.put(dto.rackCabinId(), rackCabin);

        if (dto.devices() != null && !dto.devices().isEmpty()) {
            Set<Device> innerDevices = dto.devices().stream()
                    .map(deviceDto -> mapDevice(deviceDto, topology, rackCabin))
                    .collect(Collectors.toSet());
            rackCabin.setDevices(innerDevices);
        }

        return rackCabin;
    }

    private void processDevices(SaveTopologyRequest request, Topology topology,
            Map<String, RackCabin> rackCabinMap) {
        if (request.devices() == null || request.devices().isEmpty()) {
            return;
        }

        Set<Device> devices = request.devices().stream()
                .map(dto -> mapDeviceWithOptionalRack(dto, topology, rackCabinMap))
                .collect(Collectors.toSet());

        if (topology.getDevices() == null) {
            topology.setDevices(devices);
        } else {
            topology.getDevices().addAll(devices);
        }
    }

    private Device mapDevice(DeviceDto dto, Topology topology, RackCabin rackCabin) {
        Device device = new Device();
        device.setDeviceId(dto.deviceId());
        device.setDeviceType(dto.deviceType());
        device.setLabel(dto.label());
        device.setPositionX(dto.positionX());
        device.setPositionY(dto.positionY());
        device.setRotation(dto.rotation());
        device.setColor(dto.color());
        device.setNote(dto.note());
        device.setFlipX(dto.flipX());
        device.setFlipY(dto.flipY());
        device.setIpAddress(dto.ipAddress() != null ? dto.ipAddress() : "192.168.1.1");
        device.setOrderIndex(dto.orderIndex());
        device.setLabelPosition(dto.labelPosition());
        device.setBrand(dto.brand());
        device.setModel(dto.model());
        device.setSerialNumber(dto.serialNumber());
        device.setSubtype(dto.subtype());
        device.setTopology(topology);
        device.setRackCabin(rackCabin);
        return device;
    }

    private Device mapDeviceWithOptionalRack(DeviceDto dto, Topology topology,
            Map<String, RackCabin> rackCabinMap) {
        RackCabin rackCabin = null;
        if (dto.rackCabinId() != null && rackCabinMap.containsKey(dto.rackCabinId())) {
            rackCabin = rackCabinMap.get(dto.rackCabinId());
        }
        return mapDevice(dto, topology, rackCabin);
    }

    private void processWorkstations(SaveTopologyRequest request, Topology topology) {
        if (request.workstations() == null || request.workstations().isEmpty()) {
            return;
        }

        Set<Workstation> workstations = request.workstations().stream()
                .map(dto -> mapWorkstation(dto, topology))
                .collect(Collectors.toSet());

        if (topology.getWorkstations() == null) {
            topology.setWorkstations(workstations);
        } else {
            topology.getWorkstations().addAll(workstations);
        }
    }

    private Workstation mapWorkstation(WorkstationDto dto, Topology topology) {
        Workstation workstation = new Workstation();
        workstation.setWorkstationId(dto.workstationId());
        workstation.setLabel(dto.label());
        workstation.setPositionX(dto.positionX());
        workstation.setPositionY(dto.positionY());
        workstation.setRotation(dto.rotation());
        workstation.setColor(dto.color());
        workstation.setNote(dto.note());
        workstation.setFlipX(dto.flipX());
        workstation.setFlipY(dto.flipY());
        workstation.setLabelPosition(dto.labelPosition());
        workstation.setTopology(topology);

        if (dto.sockets() != null && !dto.sockets().isEmpty()) {
            Set<Socket> sockets = dto.sockets().stream()
                    .map(socketDto -> mapSocket(socketDto, workstation))
                    .collect(Collectors.toSet());
            workstation.setSockets(sockets);
        }

        return workstation;
    }

    private Socket mapSocket(SaveTopologyRequest.SocketDto dto, Workstation workstation) {
        Socket socket = new Socket();
        socket.setSocketId(dto.socketId());
        socket.setSocketType(dto.socketType());
        socket.setLabel(dto.label());
        socket.setColor(dto.color());
        socket.setNote(dto.note());
        socket.setSlotNumber(dto.slotNumber());
        socket.setOrderIndex(dto.orderIndex());
        socket.setLabelPosition(dto.labelPosition());
        socket.setWorkstation(workstation);
        return socket;
    }

    private void processStandaloneSockets(SaveTopologyRequest request, Topology topology) {
        if (request.sockets() == null || request.sockets().isEmpty()) {
            return;
        }

        Set<Socket> sockets = request.sockets().stream()
                .map(dto -> mapStandaloneSocket(dto, topology))
                .collect(Collectors.toSet());

        if (topology.getSockets() == null) {
            topology.setSockets(sockets);
        } else {
            topology.getSockets().addAll(sockets);
        }
    }

    private Socket mapStandaloneSocket(SaveTopologyRequest.SocketDto dto, Topology topology) {
        Socket socket = new Socket();
        socket.setSocketId(dto.socketId());
        socket.setSocketType(dto.socketType());
        socket.setLabel(dto.label());
        socket.setPositionX(dto.positionX());
        socket.setPositionY(dto.positionY());
        socket.setColor(dto.color());
        socket.setNote(dto.note());
        socket.setSlotNumber(dto.slotNumber());
        socket.setOrderIndex(dto.orderIndex());
        socket.setLabelPosition(dto.labelPosition());
        socket.setTopology(topology);
        return socket;
    }

    private void processConnections(SaveTopologyRequest request, Topology topology) {
        if (request.connections() == null || request.connections().isEmpty()) {
            return;
        }

        Set<Connection> connections = request.connections().stream()
                .map(dto -> mapConnection(dto, topology))
                .collect(Collectors.toSet());

        if (topology.getConnections() == null) {
            topology.setConnections(connections);
        } else {
            topology.getConnections().addAll(connections);
        }
    }

    private Connection mapConnection(SaveTopologyRequest.ConnectionDto dto, Topology topology) {
        Connection connection = new Connection();
        connection.setSourceDeviceId(dto.sourceDeviceId());
        connection.setTargetDeviceId(dto.targetDeviceId());
        connection.setColor(dto.color());
        connection.setLineType(dto.lineType());
        connection.setSourcePort(dto.sourcePort());
        connection.setTargetPort(dto.targetPort());
        connection.setSourceInternalDeviceId(dto.sourceInternalDeviceId());
        connection.setTargetInternalDeviceId(dto.targetInternalDeviceId());
        connection.setName(dto.name());
        connection.setWaypoints(dto.waypoints());
        connection.setTopology(topology);
        return connection;
    }
}
