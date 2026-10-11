package com.aardapeker.app.dto.request;

import java.util.List;

public record SaveTopologyRequest(
    List<String> clientUsernames,
    String blueprintPictureUrl,
    String name,
    List<DeviceDto> devices,
    List<RackCabinDto> rackCabins,
    List<WorkstationDto> workstations,
    List<SocketDto> sockets, // Standalone sockets (not attached to workstations)
    List<ConnectionDto> connections,
    // Per-project device naming/IP defaults. Prefix null = fall back to the user's Settings default.
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
    String hornSpeakerStartIp
) {
    // Device DTO (Camera, Switch, NVR, Router, Access Point)
    public record DeviceDto(
        String deviceId,
        String deviceType,
        String label,
        Double positionX,
        Double positionY,
        Integer rotation,
        String color,
        String note,
        Boolean flipX,
        Boolean flipY,
        String ipAddress, // Device IP address (default: 192.168.1.1)
        String rackCabinId, // Optional: if device is inside a rack cabin
        Integer orderIndex, // Order within rack cabin
        String labelPosition, // Label position (top, bottom, left, right)
        String brand,
        String model,
        String serialNumber,
        String subtype
    ) {}

    // Rack Cabin DTO (can contain NVR, Switch, Router)
    public record RackCabinDto(
        String rackCabinId,
        String label,
        Double positionX,
        Double positionY,
        Integer rotation,
        String color,
        String note,
        Boolean flipX,
        Boolean flipY,
        String labelPosition, // Label position (top, bottom, left, right)
        List<DeviceDto> devices // Devices inside this rack cabin
    ) {}

    // Workstation DTO (can contain sockets)
    public record WorkstationDto(
        String workstationId,
        String label,
        Double positionX,
        Double positionY,
        Integer rotation,
        String color,
        String note,
        Boolean flipX,
        Boolean flipY,
        String labelPosition, // Label position (top, bottom, left, right)
        List<SocketDto> sockets // Sockets inside this workstation
    ) {}

    // Socket DTO (UPS, CAT6, normal, etc.)
    public record SocketDto(
        String socketId,
        String socketType,
        String label,
        Double positionX, // Position for standalone sockets
        Double positionY, // Position for standalone sockets
        String color,
        String note,
        Integer slotNumber,
        Integer orderIndex, // Order within workstation
        String labelPosition // Label position (top, bottom, left, right)
    ) {}

    // Connection DTO
    public record ConnectionDto(
        String id,
        String sourceDeviceId,
        String targetDeviceId,
        String color,
        String lineType,
        Integer sourcePort,
        Integer targetPort,
        String sourceInternalDeviceId,
        String targetInternalDeviceId,
        String name,
        String waypoints
    ) {}
}
