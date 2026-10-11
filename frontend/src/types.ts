import type { SocketType, LabelPosition } from "./components/icons";

export type CurrentUserType = {
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  isAdmin: boolean;
  isClient: boolean;
  role: string;
  profilePictureUrl?: string;
  ipAddress: string;
  customPermissions?: CustomPermission[];
};

export interface UserDetailsType {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  createdAt: string;
  verificationCode: string | null;
  verificationCodeExpiresAt: string | null;
  accountNonExpired: boolean;
  accountNonLocked: boolean;
  credentialsNonExpired: boolean;
  authorities: string[];
  enabled: boolean;
}

export type SidebarContextProps = {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};

export type AuthContextType = {
  user: UserDetailsType | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: UserDetailsType) => void;
  logout: () => void;
  refreshToken: () => Promise<void>;
};

export type HeaderProps = {
  userData: CurrentUserType;
  isAdmin?: boolean;
};

export type UserVerificationData = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  profilePictureUrl?: string;
  authorities: UserRole[];
  status: UserStatus;
  createdAt: string;
};

export type PaginatedUsersResponse = {
  content: User[];
  currentPage: number;
  totalItems: number;
  totalPages: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
  message: string;
};

export type LoginAttemptsResponse = {
  content: LoginAttemptsContent[];
  currentPage: number;
  totalItems: number;
  totalPages: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

export type LoginAttemptsContent = {
  id: string;
  email: string;
  successful: boolean;
  ipAddress: string;
  deviceType: string;
  deviceModel: string;
  browser: string;
  os: string;
  location: string;
  attemptedAt: string;
  failureReason: string | null;
};

export type NetworkScanHost = {
  id: string;
  scanBatchId: string;
  sourceId: string;
  subnet: string | null;
  scannedAt: string;
  ip: string;
  mac: string | null;
  vendor: string | null;
  hostname: string | null;
  openPorts: string | null;
  createdAt: string;
};

export type PaginatedNetworkScanResponse = {
  content: NetworkScanHost[];
  currentPage: number;
  totalItems: number;
  totalPages: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

export type PaginationData = {
  currentPage: number;
  totalItems: number;
  totalPages: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
  message: string;
};

export enum UserRole {
  ADMIN = "ROLE_ADMIN",
  DEVELOPER = "ROLE_DEVELOPER",
  MANAGER = "ROLE_MANAGER",
  MODERATOR = "ROLE_MODERATOR",
  TECH = "ROLE_TECH",
  CLIENT = "ROLE_CLIENT",
  CUSTOM = "ROLE_CUSTOM",
}

export enum CustomPermission {
  ACCESS_ADMIN_PANEL = "ACCESS_ADMIN_PANEL",
  VIEW_ALL_TOPOLOGIES = "VIEW_ALL_TOPOLOGIES",
  VIEW_OWN_UNASSIGNED = "VIEW_OWN_UNASSIGNED",
  CREATE_TOPOLOGY = "CREATE_TOPOLOGY",
  EDIT_OWN_UNASSIGNED = "EDIT_OWN_UNASSIGNED",
  ASSIGN_TO_CLIENT = "ASSIGN_TO_CLIENT",
  EDIT_ALL_UNASSIGNED = "EDIT_ALL_UNASSIGNED",
  EDIT_CLIENT_ASSIGNED = "EDIT_CLIENT_ASSIGNED",
  VIEW_OWN_ASSIGNED = "VIEW_OWN_ASSIGNED",
}

export enum UserStatus {
  ACTIVE = "ACTIVE",
  PENDING = "PENDING",
  BANNED = "BANNED",
  EXPIRED = "EXPIRED",
}

export type LoginAttempt = {
  id: string;
  email: string;
  successful: boolean;
  ipAddress: string;
  deviceType: string;
  deviceModel: string;
  browser: string;
  os: string;
  location: string;
  attemptedAt: string;
  failureReason: string | null;
};

// Topology Diagram Types

// Device types (placeable on map or inside rack cabins)
export enum DeviceType {
  CAMERA = "camera",
  SWITCH = "switch",
  NVR = "nvr",
  ROUTER = "router",
  ACCESS_POINT = "access_point",
  UPS = "ups",
  HORN_SPEAKER = "horn_speaker",
}

export interface Position {
  x: number;
  y: number;
}

// Device on the map (Camera, Switch, NVR, Router, Access Point)
export interface TopologyDevice {
  id: string;
  type: DeviceType;
  position: Position;
  label: string;
  rotation: number;
  color?: string | null;
  note?: string | null;
  flipX?: boolean;
  flipY?: boolean;
  ipAddress?: string | null; // Device IP address (default: 192.168.1.1)
  rackCabinId?: string | null; // If device is inside a rack cabin
  orderIndex?: number | null;
  labelPosition?: LabelPosition | null; // Label position (top, bottom, left, right)
  brand?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  subtype?: string | null;
}

// Socket (can be standalone or inside a workstation)
export interface TopologySocket {
  id: string;
  socketType: SocketType;
  label: string;
  position?: Position; // Position for standalone sockets
  color?: string | null;
  note?: string | null;
  slotNumber?: number;
  workstationId?: string | null; // Optional - null for standalone sockets
  orderIndex?: number | null;
  labelPosition?: LabelPosition | null; // Label position (top, bottom, left, right)
}

// Rack Cabin (can contain NVR, Switch, Router)
export interface TopologyRackCabin {
  id: string;
  position: Position;
  label: string;
  rotation: number;
  color?: string | null;
  note?: string | null;
  flipX?: boolean;
  flipY?: boolean;
  devices?: TopologyDevice[]; // Devices inside this rack cabin
  labelPosition?: LabelPosition | null; // Label position (top, bottom, left, right)
}

// Workstation (can contain sockets)
export interface TopologyWorkstation {
  id: string;
  position: Position;
  label: string;
  rotation: number;
  color?: string | null;
  note?: string | null;
  flipX?: boolean;
  flipY?: boolean;
  sockets?: TopologySocket[]; // Sockets inside this workstation
  labelPosition?: LabelPosition | null; // Label position (top, bottom, left, right)
}

export type LineType = "data" | "fiber" | "electric" | "coaxial";

export interface TopologyConnection {
  id: string;
  sourceDeviceId: string;
  targetDeviceId: string;
  lineType?: LineType;
  color?: string | null;
  sourcePort?: number | null;
  targetPort?: number | null;
  sourceInternalDeviceId?: string | null;
  targetInternalDeviceId?: string | null;
  name?: string | null;
  waypoints?: [number, number][] | null;
}
