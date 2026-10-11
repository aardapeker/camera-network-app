package com.aardapeker.app.dto.response;

import com.aardapeker.app.model.Connection;
import com.aardapeker.app.model.Device;
import com.aardapeker.app.model.RackCabin;
import com.aardapeker.app.model.Socket;
import com.aardapeker.app.model.Topology;
import com.aardapeker.app.model.Workstation;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

public record TopologyResponse(
    String id,
    String name,
    String blueprintPictureUrl,
    LocalDateTime createdAt,
    LocalDateTime updatedAt,
    List<String> clientUsernames,
    String createdByUsername,
    Set<Device> devices,
    Set<RackCabin> rackCabins,
    Set<Workstation> workstations,
    Set<SocketDto> sockets, // Standalone sockets
    Set<Connection> connections,
    String cameraPrefix,
    Integer cameraStartNumber,
    String cameraStartIp,
    String switchPrefix,
    Integer switchStartNumber,
    String switchStartIp,
    String nvrPrefix,
    Integer nvrStartNumber,
    String nvrStartIp,
    String routerPrefix,
    Integer routerStartNumber,
    String routerStartIp,
    String accessPointPrefix,
    Integer accessPointStartNumber,
    String accessPointStartIp,
    String upsPrefix,
    Integer upsStartNumber,
    String upsStartIp,
    String hornSpeakerPrefix,
    Integer hornSpeakerStartNumber,
    String hornSpeakerStartIp,
    String message
) {
    // DTO for sockets to include proper field mapping
    public record SocketDto(
        String id,
        String socketId,
        String socketType,
        String label,
        Double positionX,
        Double positionY,
        String color,
        String note,
        Integer slotNumber,
        Integer orderIndex
    ) {
        public static SocketDto from(Socket socket) {
            return new SocketDto(
                socket.getId(),
                socket.getSocketId(),
                socket.getSocketType(),
                socket.getLabel(),
                socket.getPositionX(),
                socket.getPositionY(),
                socket.getColor(),
                socket.getNote(),
                socket.getSlotNumber(),
                socket.getOrderIndex()
            );
        }
    }

    public static TopologyResponse from(Topology topology, String message) {
        Set<SocketDto> socketDtos = topology.getSockets() != null
            ? topology.getSockets().stream().map(SocketDto::from).collect(java.util.stream.Collectors.toSet())
            : null;

        return new TopologyResponse(
            topology.getId(),
            topology.getName(),
            topology.getBlueprintPictureUrl(),
            topology.getCreatedAt(),
            topology.getUpdatedAt(),
            topology.getClients() != null
                ? topology.getClients().stream().map(u -> u.getUsername()).collect(Collectors.toList())
                : List.of(),
            topology.getCreatedBy() != null ? topology.getCreatedBy().getUsername() : null,
            topology.getDevices(),
            topology.getRackCabins(),
            topology.getWorkstations(),
            socketDtos,
            topology.getConnections(),
            topology.getCameraPrefix(),
            topology.getCameraStartNumber(),
            topology.getCameraStartIp(),
            topology.getSwitchPrefix(),
            topology.getSwitchStartNumber(),
            topology.getSwitchStartIp(),
            topology.getNvrPrefix(),
            topology.getNvrStartNumber(),
            topology.getNvrStartIp(),
            topology.getRouterPrefix(),
            topology.getRouterStartNumber(),
            topology.getRouterStartIp(),
            topology.getAccessPointPrefix(),
            topology.getAccessPointStartNumber(),
            topology.getAccessPointStartIp(),
            topology.getUpsPrefix(),
            topology.getUpsStartNumber(),
            topology.getUpsStartIp(),
            topology.getHornSpeakerPrefix(),
            topology.getHornSpeakerStartNumber(),
            topology.getHornSpeakerStartIp(),
            message
        );
    }

    public static TopologyResponse from(Topology topology) {
        return from(topology, null);
    }
}
