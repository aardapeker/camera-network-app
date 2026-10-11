import { getSessionToken } from "./get_session_token";
import type {
  TopologyDevice,
  TopologyConnection,
  TopologyRackCabin,
  TopologyWorkstation,
  TopologySocket,
} from "~/types";
import type { DeviceDefaultsFields } from "~/lib/device-defaults";

interface DeviceDto {
  deviceId: string;
  deviceType: string;
  label: string;
  positionX: number;
  positionY: number;
  rotation: number;
  color: string | null;
  note: string | null;
  flipX: boolean | null;
  flipY: boolean | null;
  ipAddress: string | null;
  rackCabinId: string | null;
  orderIndex: number | null;
  labelPosition: string | null;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  subtype: string | null;
}

interface SocketDto {
  socketId: string;
  socketType: string;
  label: string;
  positionX?: number | null;
  positionY?: number | null;
  color: string | null;
  note: string | null;
  slotNumber: number | null;
  workstationId?: string | null;
  orderIndex: number | null;
  labelPosition: string | null;
}

interface RackCabinDto {
  rackCabinId: string;
  label: string;
  positionX: number;
  positionY: number;
  rotation: number;
  color: string | null;
  note: string | null;
  flipX: boolean | null;
  flipY: boolean | null;
  labelPosition: string | null;
  devices: DeviceDto[];
}

interface WorkstationDto {
  workstationId: string;
  label: string;
  positionX: number;
  positionY: number;
  rotation: number;
  color: string | null;
  note: string | null;
  flipX: boolean | null;
  flipY: boolean | null;
  labelPosition: string | null;
  sockets: SocketDto[];
}

interface ConnectionDto {
  id: string;
  sourceDeviceId: string;
  targetDeviceId: string;
  color: string | null;
  lineType: string | null;
  sourcePort: number | null;
  targetPort: number | null;
  sourceInternalDeviceId: string | null;
  targetInternalDeviceId: string | null;
  name: string | null;
  waypoints: string | null;
}

interface UpdateTopologyRequest {
  clientUsernames: string[];
  blueprintPictureUrl: string;
  name: string;
  devices: DeviceDto[];
  rackCabins: RackCabinDto[];
  workstations: WorkstationDto[];
  sockets: SocketDto[];
  connections: ConnectionDto[];
  cameraPrefix?: string | null;
  cameraStartNumber?: number | null;
  cameraStartIp?: string | null;
  switchPrefix?: string | null;
  switchStartNumber?: number | null;
  switchStartIp?: string | null;
  nvrPrefix?: string | null;
  nvrStartNumber?: number | null;
  nvrStartIp?: string | null;
  routerPrefix?: string | null;
  routerStartNumber?: number | null;
  routerStartIp?: string | null;
  accessPointPrefix?: string | null;
  accessPointStartNumber?: number | null;
  accessPointStartIp?: string | null;
  upsPrefix?: string | null;
  upsStartNumber?: number | null;
  upsStartIp?: string | null;
  hornSpeakerPrefix?: string | null;
  hornSpeakerStartNumber?: number | null;
  hornSpeakerStartIp?: string | null;
}

interface UpdateTopologyResponse {
  id: string;
  name: string;
  blueprintPictureUrl: string;
  createdAt: string;
}

async function updateTopology(
  topologyId: string,
  clientUsernames: string[],
  blueprintPictureUrl: string,
  devices: TopologyDevice[],
  connections: TopologyConnection[] = [],
  rackCabins: TopologyRackCabin[] = [],
  workstations: TopologyWorkstation[] = [],
  standaloneSockets: TopologySocket[] = [],
  topologyName?: string,
  deviceDefaults?: DeviceDefaultsFields,
): Promise<UpdateTopologyResponse> {
  const token = getSessionToken();

  if (!token) {
    throw new Error("No authentication token found");
  }

  if (!topologyId) {
    throw new Error("Topology ID is required");
  }

  if (!blueprintPictureUrl) {
    throw new Error("Blueprint URL is required");
  }

  const requestBody: UpdateTopologyRequest = {
    clientUsernames,
    blueprintPictureUrl,
    name: topologyName || `Topology-${Date.now()}`,
    devices: devices.map((device) => ({
      deviceId: device.id,
      deviceType: device.type,
      label: device.label,
      positionX: device.position.x,
      positionY: device.position.y,
      rotation: device.rotation,
      color: device.color || null,
      note: device.note || null,
      flipX: device.flipX || null,
      flipY: device.flipY || null,
      ipAddress: device.ipAddress || "192.168.1.1",
      rackCabinId: device.rackCabinId || null,
      orderIndex: device.orderIndex ?? null,
      labelPosition: device.labelPosition || null,
      brand: device.brand || null,
      model: device.model || null,
      serialNumber: device.serialNumber || null,
      subtype: device.subtype || null,
    })),
    rackCabins: rackCabins.map((rackCabin) => ({
      rackCabinId: rackCabin.id,
      label: rackCabin.label,
      positionX: rackCabin.position.x,
      positionY: rackCabin.position.y,
      rotation: rackCabin.rotation,
      color: rackCabin.color || null,
      note: rackCabin.note || null,
      flipX: rackCabin.flipX || null,
      flipY: rackCabin.flipY || null,
      labelPosition: rackCabin.labelPosition || null,
      devices: (rackCabin.devices || []).map((device) => ({
        deviceId: device.id,
        deviceType: device.type,
        label: device.label,
        positionX: device.position.x,
        positionY: device.position.y,
        rotation: device.rotation,
        color: device.color || null,
        note: device.note || null,
        flipX: device.flipX || null,
        flipY: device.flipY || null,
        ipAddress: device.ipAddress || "192.168.1.1",
        rackCabinId: rackCabin.id,
        orderIndex: device.orderIndex ?? null,
        labelPosition: device.labelPosition || null,
        brand: device.brand || null,
        model: device.model || null,
        serialNumber: device.serialNumber || null,
        subtype: device.subtype || null,
      })),
    })),
    workstations: workstations.map((workstation) => ({
      workstationId: workstation.id,
      label: workstation.label,
      positionX: workstation.position.x,
      positionY: workstation.position.y,
      rotation: workstation.rotation,
      color: workstation.color || null,
      note: workstation.note || null,
      flipX: workstation.flipX || null,
      flipY: workstation.flipY || null,
      labelPosition: workstation.labelPosition || null,
      sockets: (workstation.sockets || []).map((socket) => ({
        socketId: socket.id,
        socketType: socket.socketType,
        label: socket.label,
        color: socket.color || null,
        note: socket.note || null,
        slotNumber: socket.slotNumber || null,
        orderIndex: socket.orderIndex ?? null,
        labelPosition: socket.labelPosition || null,
      })),
    })),
    sockets: standaloneSockets.map((socket) => ({
      socketId: socket.id,
      socketType: socket.socketType,
      label: socket.label,
      positionX: socket.position?.x || null,
      positionY: socket.position?.y || null,
      color: socket.color || null,
      note: socket.note || null,
      slotNumber: socket.slotNumber || null,
      workstationId: null,
      orderIndex: socket.orderIndex ?? null,
      labelPosition: socket.labelPosition || null,
    })),
    connections: connections.map((conn) => ({
      id: conn.id,
      sourceDeviceId: conn.sourceDeviceId,
      targetDeviceId: conn.targetDeviceId,
      color: conn.color || null,
      lineType: conn.lineType || null,
      sourcePort: conn.sourcePort ?? null,
      targetPort: conn.targetPort ?? null,
      sourceInternalDeviceId: conn.sourceInternalDeviceId ?? null,
      targetInternalDeviceId: conn.targetInternalDeviceId ?? null,
      name: conn.name ?? null,
      waypoints: conn.waypoints ? JSON.stringify(conn.waypoints) : null,
    })),
    ...(deviceDefaults ?? {}),
  };

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const response = await fetch(`/api/topologies/${topologyId}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `Server error: ${response.status}`);
  }

  return await response.json();
}

export default updateTopology;
