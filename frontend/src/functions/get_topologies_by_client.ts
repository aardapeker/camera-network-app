import { getSessionToken } from "./get_session_token";

// Device data (Camera, Switch, NVR, Router, Access Point)
export interface DeviceData {
  id: string;
  deviceId: string;
  deviceType: string;
  label: string;
  positionX: number;
  positionY: number;
  rotation: number;
  color: string | null;
  note: string | null;
  flipX?: boolean;
  flipY?: boolean;
  ipAddress?: string | null; // Device IP address (default: 192.168.1.1)
  rackCabinId?: string | null; // If device is inside a rack cabin
  orderIndex?: number | null;
  labelPosition?: string | null; // Label position (top, bottom, left, right)
  brand?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  subtype?: string | null;
}

// Socket data (for Workstations or standalone)
export interface SocketData {
  id: string;
  socketId: string;
  socketType: string;
  label: string;
  positionX?: number | null; // Position for standalone sockets
  positionY?: number | null; // Position for standalone sockets
  color: string | null;
  note: string | null;
  slotNumber?: number;
  workstationId?: string | null; // Optional for standalone sockets
  orderIndex?: number | null;
  labelPosition?: string | null; // Label position (top, bottom, left, right)
}

// Rack Cabin data (can contain NVR, Switch, Router)
export interface RackCabinData {
  id: string;
  rackCabinId: string;
  label: string;
  positionX: number;
  positionY: number;
  rotation: number;
  color: string | null;
  note: string | null;
  flipX?: boolean;
  flipY?: boolean;
  devices?: DeviceData[]; // Devices inside this rack cabin
  labelPosition?: string | null; // Label position (top, bottom, left, right)
}

// Workstation data (can contain sockets)
export interface WorkstationData {
  id: string;
  workstationId: string;
  label: string;
  positionX: number;
  positionY: number;
  rotation: number;
  color: string | null;
  note: string | null;
  flipX?: boolean;
  flipY?: boolean;
  sockets?: SocketData[]; // Sockets inside this workstation
  labelPosition?: string | null; // Label position (top, bottom, left, right)
}

// Connection data
export interface ConnectionData {
  id: string;
  sourceDeviceId: string;
  targetDeviceId: string;
  color?: string | null;
  lineType?: string | null;
  sourcePort?: number | null;
  targetPort?: number | null;
  sourceInternalDeviceId?: string | null;
  targetInternalDeviceId?: string | null;
  name?: string | null;
  waypoints?: string | null;
}

// Topology data
export interface Topology {
  id: string;
  name: string;
  blueprintPictureUrl: string | null;
  createdAt: string;
  updatedAt?: string | null;
  clientUsernames?: string[] | null;
  createdByUsername?: string | null;
  devices?: DeviceData[];
  sockets?: SocketData[];
  rackCabins?: RackCabinData[];
  workstations?: WorkstationData[];
  connections?: ConnectionData[];
  // Per-project device naming/IP defaults. Prefix null = fall back to the user's Settings default.
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

// API response structure
interface TopologyListResponse {
  topologies: Topology[];
  count: number;
  message: string | null;
}

async function getTopologiesByClient(
  clientUsername: string,
): Promise<Topology[]> {
  const token = getSessionToken();

  if (!token) {
    throw new Error("No authentication token found");
  }

  if (!clientUsername) {
    throw new Error("Client username is required");
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const response = await fetch(`/api/topologies/client/${clientUsername}`, {
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `Server error: ${response.status}`);
  }

  const data: TopologyListResponse = await response.json();
  return data.topologies;
}

export default getTopologiesByClient;
