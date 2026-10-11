import type {
  DeviceType,
  InfrastructureType,
  SocketType,
  LabelPosition,
} from "~/components/icons";
import type { LineType } from "~/types";

// Viewer types - used in topology-viewer.tsx
export interface ViewerDevice {
  id: string;
  deviceId: string;
  type: DeviceType;
  label: string;
  lat: number;
  lng: number;
  rotation: number;
  color?: string | null;
  note?: string | null;
  flipX?: boolean;
  flipY?: boolean;
  ipAddress?: string | null;
  rackCabinId?: string | null;
  orderIndex?: number | null;
  labelPosition?: LabelPosition | null;
  brand?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  subtype?: string | null;
}

export interface ViewerSocket {
  id: string;
  socketId: string;
  type: SocketType;
  label: string;
  lat?: number | null; // Position for standalone sockets
  lng?: number | null; // Position for standalone sockets
  color?: string | null;
  note?: string | null;
  workstationId?: string | null;
  orderIndex?: number | null;
  labelPosition?: LabelPosition | null;
}

export interface ViewerInfrastructure {
  id: string;
  infraId: string;
  type: InfrastructureType;
  label: string;
  lat: number;
  lng: number;
  rotation: number;
  color?: string | null;
  note?: string | null;
  flipX?: boolean;
  flipY?: boolean;
  labelPosition?: LabelPosition | null;
}

export interface ViewerConnection {
  id: string;
  sourceDeviceId: string;
  targetDeviceId: string;
  color?: string | null;
  lineType?: LineType;
  sourcePort?: number | null;
  targetPort?: number | null;
  sourceInternalDeviceId?: string | null;
  targetInternalDeviceId?: string | null;
  name?: string | null;
  waypoints?: [number, number][] | null;
}

// Editor types - used in topology-editor-page.tsx
export interface LeafletDevice {
  id: string;
  name: string;
  type: DeviceType;
  lat: number;
  lng: number;
  rotation: number;
  color?: string | null;
  note?: string | null;
  flipX?: boolean;
  flipY?: boolean;
  ipAddress?: string | null;
  rackCabinId?: string | null;
  workstationId?: string | null;
  orderIndex?: number | null;
  labelPosition?: LabelPosition | null;
  brand?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  subtype?: string | null;
}

export interface LeafletSocket {
  id: string;
  name: string;
  type: SocketType;
  lat: number;
  lng: number;
  rotation: number;
  color?: string | null;
  note?: string | null;
  flipX?: boolean;
  flipY?: boolean;
  workstationId?: string | null; // Optional - null for standalone sockets
  orderIndex?: number | null;
  labelPosition?: LabelPosition | null;
}

export interface LeafletInfrastructure {
  id: string;
  label: string;
  type: InfrastructureType;
  lat: number;
  lng: number;
  rotation: number;
  color?: string | null;
  note?: string | null;
  flipX?: boolean;
  flipY?: boolean;
  labelPosition?: LabelPosition | null;
}
