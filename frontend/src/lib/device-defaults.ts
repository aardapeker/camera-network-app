import { DeviceType } from "~/components/icons";
import type { UserSettings } from "~/functions/get_settings";
import type { Topology } from "~/functions/get_topologies_by_client";

/** Per-project naming/IP defaults for one device type. `prefix: null` means "follow the user's Settings default". */
export interface DeviceProjectDefaults {
  prefix: string | null;
  startNumber: number;
  startIp: string;
}

export type DeviceTypePrefixes = Record<DeviceType, string>;
export type ProjectDeviceDefaultsMap = Record<DeviceType, DeviceProjectDefaults>;

export const DEFAULT_START_NUMBER = 1;
export const DEFAULT_START_IP = "192.168.1.1";

/** Device types that don't have an IP address by nature (no network interface). */
export const DEVICE_TYPES_WITHOUT_IP: DeviceType[] = [DeviceType.UPS, DeviceType.HORN_SPEAKER];

export function deviceTypeHasIp(type: DeviceType): boolean {
  return !DEVICE_TYPES_WITHOUT_IP.includes(type);
}

/** Maps each DeviceType to the camelCase field prefix used by the backend (cameraPrefix, accessPointStartIp, ...). */
const FIELD_KEY: Record<DeviceType, string> = {
  [DeviceType.CAMERA]: "camera",
  [DeviceType.SWITCH]: "switch",
  [DeviceType.NVR]: "nvr",
  [DeviceType.ROUTER]: "router",
  [DeviceType.ACCESS_POINT]: "accessPoint",
  [DeviceType.UPS]: "ups",
  [DeviceType.HORN_SPEAKER]: "hornSpeaker",
};

/** Extracts the 7 global name-prefix defaults from a Settings response. */
export function getSettingsPrefixes(settings: UserSettings): DeviceTypePrefixes {
  return {
    [DeviceType.CAMERA]: settings.cameraPrefix,
    [DeviceType.SWITCH]: settings.switchPrefix,
    [DeviceType.NVR]: settings.nvrPrefix,
    [DeviceType.ROUTER]: settings.routerPrefix,
    [DeviceType.ACCESS_POINT]: settings.accessPointPrefix,
    [DeviceType.UPS]: settings.upsPrefix,
    [DeviceType.HORN_SPEAKER]: settings.hornSpeakerPrefix,
  };
}

/** The 21 flat `{typePrefix, typeStartNumber, typeStartIp}` fields the backend expects. */
export interface DeviceDefaultsFields {
  cameraPrefix: string | null;
  cameraStartNumber: number | null;
  cameraStartIp: string | null;
  switchPrefix: string | null;
  switchStartNumber: number | null;
  switchStartIp: string | null;
  nvrPrefix: string | null;
  nvrStartNumber: number | null;
  nvrStartIp: string | null;
  routerPrefix: string | null;
  routerStartNumber: number | null;
  routerStartIp: string | null;
  accessPointPrefix: string | null;
  accessPointStartNumber: number | null;
  accessPointStartIp: string | null;
  upsPrefix: string | null;
  upsStartNumber: number | null;
  upsStartIp: string | null;
  hornSpeakerPrefix: string | null;
  hornSpeakerStartNumber: number | null;
  hornSpeakerStartIp: string | null;
}

/** Builds the 21 flat fields the backend expects from the per-type defaults map. */
export function flattenProjectDefaults(defaults: ProjectDeviceDefaultsMap): DeviceDefaultsFields {
  return {
    cameraPrefix: defaults[DeviceType.CAMERA]?.prefix ?? null,
    cameraStartNumber: defaults[DeviceType.CAMERA]?.startNumber ?? null,
    cameraStartIp: defaults[DeviceType.CAMERA]?.startIp ?? null,
    switchPrefix: defaults[DeviceType.SWITCH]?.prefix ?? null,
    switchStartNumber: defaults[DeviceType.SWITCH]?.startNumber ?? null,
    switchStartIp: defaults[DeviceType.SWITCH]?.startIp ?? null,
    nvrPrefix: defaults[DeviceType.NVR]?.prefix ?? null,
    nvrStartNumber: defaults[DeviceType.NVR]?.startNumber ?? null,
    nvrStartIp: defaults[DeviceType.NVR]?.startIp ?? null,
    routerPrefix: defaults[DeviceType.ROUTER]?.prefix ?? null,
    routerStartNumber: defaults[DeviceType.ROUTER]?.startNumber ?? null,
    routerStartIp: defaults[DeviceType.ROUTER]?.startIp ?? null,
    accessPointPrefix: defaults[DeviceType.ACCESS_POINT]?.prefix ?? null,
    accessPointStartNumber: defaults[DeviceType.ACCESS_POINT]?.startNumber ?? null,
    accessPointStartIp: defaults[DeviceType.ACCESS_POINT]?.startIp ?? null,
    upsPrefix: defaults[DeviceType.UPS]?.prefix ?? null,
    upsStartNumber: defaults[DeviceType.UPS]?.startNumber ?? null,
    upsStartIp: defaults[DeviceType.UPS]?.startIp ?? null,
    hornSpeakerPrefix: defaults[DeviceType.HORN_SPEAKER]?.prefix ?? null,
    hornSpeakerStartNumber: defaults[DeviceType.HORN_SPEAKER]?.startNumber ?? null,
    hornSpeakerStartIp: defaults[DeviceType.HORN_SPEAKER]?.startIp ?? null,
  };
}

/**
 * Rebuilds the per-type defaults map from a loaded topology's 21 flat fields, falling back to the
 * user's current Settings prefix (and built-in start number/IP) for anything not yet set.
 */
export function unflattenProjectDefaults(
  topology: Pick<
    Topology,
    | "cameraPrefix" | "cameraStartNumber" | "cameraStartIp"
    | "switchPrefix" | "switchStartNumber" | "switchStartIp"
    | "nvrPrefix" | "nvrStartNumber" | "nvrStartIp"
    | "routerPrefix" | "routerStartNumber" | "routerStartIp"
    | "accessPointPrefix" | "accessPointStartNumber" | "accessPointStartIp"
    | "upsPrefix" | "upsStartNumber" | "upsStartIp"
    | "hornSpeakerPrefix" | "hornSpeakerStartNumber" | "hornSpeakerStartIp"
  >,
  settingsPrefixes: DeviceTypePrefixes,
): ProjectDeviceDefaultsMap {
  const flat = topology as Record<string, string | number | null | undefined>;
  const result = {} as ProjectDeviceDefaultsMap;
  for (const type of Object.values(DeviceType)) {
    const key = FIELD_KEY[type];
    const prefix = flat[`${key}Prefix`];
    const startNumber = flat[`${key}StartNumber`];
    const startIp = flat[`${key}StartIp`];
    result[type] = {
      prefix: (prefix as string | null | undefined) ?? settingsPrefixes[type] ?? null,
      startNumber: (startNumber as number | null | undefined) ?? DEFAULT_START_NUMBER,
      startIp: (startIp as string | null | undefined) ?? DEFAULT_START_IP,
    };
  }
  return result;
}

/** Built-in defaults for a brand-new project: Settings prefix, start number 1, start IP 192.168.1.1. */
export function buildInitialProjectDefaults(settingsPrefixes: DeviceTypePrefixes): ProjectDeviceDefaultsMap {
  const result = {} as ProjectDeviceDefaultsMap;
  for (const type of Object.values(DeviceType)) {
    result[type] = {
      prefix: settingsPrefixes[type] ?? null,
      startNumber: DEFAULT_START_NUMBER,
      startIp: DEFAULT_START_IP,
    };
  }
  return result;
}
