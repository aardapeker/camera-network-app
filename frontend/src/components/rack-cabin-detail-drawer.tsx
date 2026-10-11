import {
  Server,
  Network,
  X,
  Cable,
  Zap,
  ArrowRight,
  ArrowLeftRight,
  GripVertical,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "./ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  DeviceType,
  deviceIcons,
  deviceColors,
  infrastructureIcons,
  infrastructureColors,
  CameraSubtype,
  cameraSubtypeIcons,
  type InfrastructureType,
} from "./icons";
import type { TopologyConnection, LineType } from "~/types";
import { CABLE_COLORS, COLOR_FALLBACK_HEX } from "~/constants/colors";
import { useTranslation } from "react-i18next";
import { useTypeLabels } from "~/hooks/use-type-labels";

const LINE_TYPE_LABEL_KEYS: Record<LineType, string> = {
  data: "editor.lineTypeData",
  fiber: "editor.lineTypeFiber",
  electric: "editor.lineTypeElectric",
  coaxial: "editor.lineTypeCoaxial",
};

interface ChildDevice {
  id: string;
  name: string;
  type: DeviceType;
  ipAddress?: string | null;
  note?: string | null;
  brand?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  subtype?: string | null;
}

interface DeviceRef {
  id: string;
  name: string;
  type: string;
}

// A connection going to/from the rack cabinet
interface CabinetConnection {
  connectionId: string;
  remoteDevice: DeviceRef;
  remoteDeviceId: string;
  /** Which side of the connection is the cabinet: "source" or "target" */
  cabinetSide: "source" | "target";
  /** Port number on the cabinet side */
  port: number | null;
  /** Internal device ID (which switch handles this connection) */
  internalDeviceId: string | null;
  lineType?: LineType;
  color?: string | null;
  /** Cable name (e.g. "cable-cam-1") */
  name?: string | null;
}

interface RackCabinDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cabinetId: string;
  cabinetName: string;
  cabinetNote?: string | null;
  childDevices: ChildDevice[];
  connections?: TopologyConnection[];
  allDevices?: DeviceRef[];
  isEditable?: boolean;
  onRemoveDevice?: (deviceId: string) => void;
  onUpdateDeviceIp?: (deviceId: string, ip: string) => void;
  onUpdateDeviceName?: (deviceId: string, name: string) => void;
  onUpdateDeviceNote?: (deviceId: string, name: string) => void;
  onUpdateDeviceBrand?: (deviceId: string, brand: string) => void;
  onUpdateDeviceModel?: (deviceId: string, model: string) => void;
  onUpdateDeviceSerialNumber?: (deviceId: string, sn: string) => void;
  onUpdateCabinetName?: (name: string) => void;
  onUpdateCabinetNote?: (note: string) => void;
  onUpdateConnectionPort?: (
    connectionId: string,
    deviceId: string,
    port: number | null,
  ) => void;
  onUpdateConnectionInternalDevice?: (
    connectionId: string,
    cabinetId: string,
    internalDeviceId: string | null,
  ) => void;
  onUpdateConnectionName?: (
    connectionId: string,
    name: string,
  ) => void;
  onReorderDevices?: (orderedDeviceIds: string[]) => void;
}

const LINE_TYPE_COLORS: Record<LineType, string> = {
  data: CABLE_COLORS.data,
  fiber: CABLE_COLORS.fiber,
  electric: CABLE_COLORS.electric,
  coaxial: CABLE_COLORS.coaxial,
};

function SortableDeviceItem({
  device,
  isEditable,
  onRemoveDevice,
  onUpdateDeviceIp,
  onUpdateDeviceName,
  onUpdateDeviceNote,
  onUpdateDeviceBrand,
  onUpdateDeviceModel,
  onUpdateDeviceSerialNumber,
}: {
  device: ChildDevice;
  isEditable: boolean;
  onRemoveDevice?: (deviceId: string) => void;
  onUpdateDeviceIp?: (deviceId: string, ip: string) => void;
  onUpdateDeviceName?: (deviceId: string, name: string) => void;
  onUpdateDeviceNote?: (deviceId: string, note: string) => void;
  onUpdateDeviceBrand?: (deviceId: string, brand: string) => void;
  onUpdateDeviceModel?: (deviceId: string, model: string) => void;
  onUpdateDeviceSerialNumber?: (deviceId: string, sn: string) => void;
}) {
  const { t } = useTranslation();
  const { deviceLabels, cameraSubtypeLabels } = useTypeLabels();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: device.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const DeviceIcon = (device.type === DeviceType.CAMERA && device.subtype && device.subtype in cameraSubtypeIcons)
    ? cameraSubtypeIcons[device.subtype as CameraSubtype]
    : deviceIcons[device.type];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="p-3 bg-card rounded-lg border hover:border-primary/50 transition-colors"
    >
      <div className="flex items-start gap-3">
        {isEditable && (
          <button
            className="mt-2 p-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}
        <div
          className="p-2 rounded-md shrink-0"
          style={{
            backgroundColor: `${deviceColors[device.type]}15`,
          }}
        >
          <DeviceIcon
            className="h-5 w-5"
            style={{ color: deviceColors[device.type] }}
          />
        </div>
        <div className="flex-1 min-w-0">
          {isEditable ? (
            <input
              type="text"
              value={device.name || ""}
              onChange={(e) => onUpdateDeviceName?.(device.id, e.target.value)}
              className="w-full text-sm font-medium bg-muted/50 px-2 py-1 rounded border border-transparent hover:border-border focus:border-primary focus:outline-none transition-colors"
            />
          ) : (
            <p className="font-medium text-sm truncate">{device.name}</p>
          )}
          <p className="text-xs text-muted-foreground">
            {device.type === DeviceType.CAMERA && device.subtype && device.subtype in cameraSubtypeLabels
              ? cameraSubtypeLabels[device.subtype as CameraSubtype]
              : deviceLabels[device.type]}
          </p>
          {/* IP Address (not shown for UPS) */}
          {device.type !== DeviceType.UPS && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {t("rackCabin.ipColon")}
            </span>
            {isEditable ? (
              <input
                type="text"
                value={device.ipAddress || ""}
                onChange={(e) =>
                  onUpdateDeviceIp?.(device.id, e.target.value)
                }
                placeholder={t("rackCabin.ipPlaceholder")}
                className="flex-1 text-xs bg-muted/50 px-2 py-1 rounded border border-transparent hover:border-border focus:border-primary focus:outline-none transition-colors font-mono"
              />
            ) : (
              <span className="text-xs font-mono text-foreground bg-muted/50 px-2 py-1 rounded">
                {device.ipAddress || t("rackCabin.ipNotSet")}
              </span>
            )}
          </div>
          )}
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-10 shrink-0">{t("rackCabin.noteColon")}</span>
            {isEditable ? (
              <input
                type="text"
                value={device.note || ""}
                onChange={(e) => onUpdateDeviceNote?.(device.id, e.target.value)}
                placeholder={t("rackCabin.addNote")}
                className="flex-1 text-xs bg-muted/50 px-2 py-1 rounded border border-transparent hover:border-border focus:border-primary focus:outline-none transition-colors"
              />
            ) : device.note ? (
              <span className="text-xs text-foreground bg-muted/50 px-2 py-1 rounded">{device.note}</span>
            ) : null}
          </div>
          {/* Brand */}
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-10 shrink-0">{t("rackCabin.brandColon")}</span>
            {isEditable ? (
              <input
                type="text"
                value={device.brand || ""}
                onChange={(e) => onUpdateDeviceBrand?.(device.id, e.target.value)}
                placeholder={t("rackCabin.brandPlaceholder")}
                className="flex-1 text-xs bg-muted/50 px-2 py-1 rounded border border-transparent hover:border-border focus:border-primary focus:outline-none transition-colors"
              />
            ) : device.brand ? (
              <span className="text-xs text-foreground bg-muted/50 px-2 py-1 rounded">{device.brand}</span>
            ) : null}
          </div>
          {/* Model */}
          <div className="mt-1 flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-10 shrink-0">{t("rackCabin.modelColon")}</span>
            {isEditable ? (
              <input
                type="text"
                value={device.model || ""}
                onChange={(e) => onUpdateDeviceModel?.(device.id, e.target.value)}
                placeholder={t("rackCabin.modelPlaceholder")}
                className="flex-1 text-xs bg-muted/50 px-2 py-1 rounded border border-transparent hover:border-border focus:border-primary focus:outline-none transition-colors"
              />
            ) : device.model ? (
              <span className="text-xs text-foreground bg-muted/50 px-2 py-1 rounded">{device.model}</span>
            ) : null}
          </div>
          {/* Serial Number */}
          <div className="mt-1 flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-10 shrink-0">{t("rackCabin.snColon")}</span>
            {isEditable ? (
              <input
                type="text"
                value={device.serialNumber || ""}
                onChange={(e) => onUpdateDeviceSerialNumber?.(device.id, e.target.value)}
                placeholder={t("rackCabin.snPlaceholder")}
                className="flex-1 text-xs bg-muted/50 px-2 py-1 rounded border border-transparent hover:border-border focus:border-primary focus:outline-none transition-colors font-mono"
              />
            ) : device.serialNumber ? (
              <span className="text-xs font-mono text-foreground bg-muted/50 px-2 py-1 rounded">{device.serialNumber}</span>
            ) : null}
          </div>
        </div>
        {isEditable && onRemoveDevice && (
          <button
            onClick={() => onRemoveDevice(device.id)}
            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
            title={t("rackCabin.removeFromCabinet")}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export function RackCabinDetailDrawer({
  open,
  onOpenChange,
  cabinetId,
  cabinetName,
  cabinetNote,
  childDevices,
  connections = [],
  allDevices = [],
  isEditable = false,
  onRemoveDevice,
  onUpdateDeviceIp,
  onUpdateDeviceName,
  onUpdateDeviceNote,
  onUpdateDeviceBrand,
  onUpdateDeviceModel,
  onUpdateDeviceSerialNumber,
  onUpdateCabinetName,
  onUpdateCabinetNote,
  onUpdateConnectionPort,
  onUpdateConnectionInternalDevice,
  onUpdateConnectionName,
  onReorderDevices,
}: RackCabinDetailDrawerProps) {
  const { t } = useTranslation();
  const { deviceLabels } = useTypeLabels();
  // Group devices by type for summary
  const devicesByType = childDevices.reduce(
    (acc, device) => {
      if (!acc[device.type]) {
        acc[device.type] = [];
      }
      acc[device.type].push(device);
      return acc;
    },
    {} as Record<DeviceType, ChildDevice[]>,
  );

  const deviceTypes = Object.keys(devicesByType) as DeviceType[];

  // Switches inside cabinet (for the dropdown)
  const switches = childDevices.filter(
    (d) =>
      d.type === DeviceType.SWITCH ||
      d.type === DeviceType.ROUTER,
  );

  // Build a lookup for all devices by id
  const allDevicesMap = new Map<string, DeviceRef>();
  for (const d of allDevices) {
    allDevicesMap.set(d.id, d);
  }
  for (const d of childDevices) {
    if (!allDevicesMap.has(d.id)) {
      allDevicesMap.set(d.id, { id: d.id, name: d.name, type: d.type });
    }
  }

  // Child device lookup for displaying assigned switch names
  const childDeviceMap = new Map<string, ChildDevice>();
  for (const d of childDevices) {
    childDeviceMap.set(d.id, d);
  }

  // Drag-and-drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = childDevices.findIndex((d) => d.id === active.id);
    const newIndex = childDevices.findIndex((d) => d.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(childDevices, oldIndex, newIndex);
    onReorderDevices?.(reordered.map((d) => d.id));
  };

  // Find all connections where one endpoint is the rack cabinet
  const cabinetConnections: CabinetConnection[] = [];
  for (const conn of connections) {
    if (conn.sourceDeviceId === cabinetId) {
      const remote = allDevicesMap.get(conn.targetDeviceId);
      if (remote) {
        cabinetConnections.push({
          connectionId: conn.id,
          remoteDevice: remote,
          remoteDeviceId: conn.targetDeviceId,
          cabinetSide: "source",
          port: conn.sourcePort ?? null,
          internalDeviceId: conn.sourceInternalDeviceId ?? null,
          lineType: conn.lineType,
          color: conn.color,
          name: conn.name,
        });
      }
    } else if (conn.targetDeviceId === cabinetId) {
      const remote = allDevicesMap.get(conn.sourceDeviceId);
      if (remote) {
        cabinetConnections.push({
          connectionId: conn.id,
          remoteDevice: remote,
          remoteDeviceId: conn.sourceDeviceId,
          cabinetSide: "target",
          port: conn.targetPort ?? null,
          internalDeviceId: conn.targetInternalDeviceId ?? null,
          lineType: conn.lineType,
          color: conn.color,
          name: conn.name,
        });
      }
    }
  }

  // Stable sort by connectionId so the list never reorders while editing
  // (sorting by port would shift focused inputs to different connections)
  cabinetConnections.sort((a, b) =>
    a.connectionId.localeCompare(b.connectionId),
  );

  // Split connections: electric cables go to UPS section, rest go to port section
  const portConnections = cabinetConnections.filter(
    (cc) => cc.lineType !== "electric",
  );
  const powerConnections = cabinetConnections.filter(
    (cc) => cc.lineType === "electric",
  );

  // UPS devices inside cabinet
  const upsDevices = childDevices.filter(
    (d) => d.type === DeviceType.UPS,
  );

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="h-full w-[440px] sm:max-w-[440px] z-9999">
        <DrawerHeader className="border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Server className="h-6 w-6 text-emerald-500" />
            </div>
            <div className="flex-1 min-w-0">
              {isEditable ? (
                <>
                  <DrawerTitle className="sr-only">{cabinetName}</DrawerTitle>
                  <input
                    type="text"
                    value={cabinetName}
                    onChange={(e) => onUpdateCabinetName?.(e.target.value)}
                    className="w-full text-lg font-semibold bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none transition-colors"
                  />
                </>
              ) : (
                <DrawerTitle className="text-lg truncate">
                  {cabinetName}
                </DrawerTitle>
              )}
              <DrawerDescription>
                {t("rackCabin.devicesInside", { count: childDevices.length })}
                {cabinetConnections.length > 0 && (
                  <span className="ml-1">
                    {t("rackCabin.connectionsCount", { count: cabinetConnections.length })}
                  </span>
                )}
              </DrawerDescription>
            </div>
            <DrawerClose asChild>
              <button className="p-2 rounded-md hover:bg-accent transition-colors">
                <X className="h-5 w-5" />
              </button>
            </DrawerClose>
          </div>
          {isEditable ? (
            <div className="mt-3">
              <label className="text-xs text-muted-foreground">{t("rackCabin.note")}</label>
              <textarea
                value={cabinetNote || ""}
                onChange={(e) => onUpdateCabinetNote?.(e.target.value)}
                placeholder={t("rackCabin.addNote")}
                rows={2}
                className="w-full mt-1 text-sm bg-muted/50 rounded-md p-2 border border-transparent hover:border-border focus:border-primary focus:outline-none transition-colors resize-none"
              />
            </div>
          ) : (
            cabinetNote && (
              <p className="mt-3 text-sm text-muted-foreground bg-muted/50 rounded-md p-2">
                {cabinetNote}
              </p>
            )
          )}
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-4">
          {/* Summary Section */}
          {deviceTypes.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                {t("rackCabin.summary")}
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {deviceTypes.map((type) => {
                  const DeviceIcon = deviceIcons[type];
                  const count = devicesByType[type].length;
                  return (
                    <div
                      key={type}
                      className="flex items-center gap-2 p-2 bg-card rounded-lg border"
                    >
                      <DeviceIcon
                        className="h-5 w-5 shrink-0"
                        style={{ color: deviceColors[type] }}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{count}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {deviceLabels[type]}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Devices List */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">
              {t("rackCabin.devices")}
            </h4>
            {childDevices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Network className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{t("rackCabin.noDevices")}</p>
                <p className="text-xs mt-1">
                  {t("rackCabin.dragDevicesHint")}
                </p>
              </div>
            ) : isEditable && onReorderDevices ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={childDevices.map((d) => d.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {childDevices.map((device) => (
                      <SortableDeviceItem
                        key={device.id}
                        device={device}
                        isEditable={isEditable}
                        onRemoveDevice={onRemoveDevice}
                        onUpdateDeviceIp={onUpdateDeviceIp}
                        onUpdateDeviceName={onUpdateDeviceName}
                        onUpdateDeviceNote={onUpdateDeviceNote}
                        onUpdateDeviceBrand={onUpdateDeviceBrand}
                        onUpdateDeviceModel={onUpdateDeviceModel}
                        onUpdateDeviceSerialNumber={onUpdateDeviceSerialNumber}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div className="space-y-2">
                {childDevices.map((device) => (
                  <SortableDeviceItem
                    key={device.id}
                    device={device}
                    isEditable={isEditable}
                    onRemoveDevice={onRemoveDevice}
                    onUpdateDeviceIp={onUpdateDeviceIp}
                    onUpdateDeviceName={onUpdateDeviceName}
                    onUpdateDeviceNote={onUpdateDeviceNote}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Connection Lines / Port Tracking Section */}
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <Cable className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-medium text-muted-foreground">
                {t("rackCabin.portConnections")}
              </h4>
              {portConnections.length > 0 && (
                <span className="text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-full">
                  {portConnections.length}
                </span>
              )}
            </div>

            {portConnections.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground border border-dashed border-border/50 rounded-lg">
                <ArrowLeftRight className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs">{t("rackCabin.noPortConnections")}</p>
                <p className="text-[11px] mt-1 opacity-70">
                  {t("rackCabin.connectHint")}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {portConnections.map((cc) => {
                  const RemoteIcon =
                    deviceIcons[cc.remoteDevice.type as DeviceType] ??
                    infrastructureIcons[cc.remoteDevice.type as InfrastructureType];
                  const remoteColor =
                    deviceColors[cc.remoteDevice.type as DeviceType] ??
                    infrastructureColors[cc.remoteDevice.type as InfrastructureType] ??
                    COLOR_FALLBACK_HEX;
                  const lineType = cc.lineType || "data";
                  const lineColor =
                    cc.color && /^#[0-9A-Fa-f]{6}$/.test(cc.color)
                      ? cc.color
                      : LINE_TYPE_COLORS[lineType] || CABLE_COLORS.data;

                  // Resolve the assigned switch name
                  const assignedSwitch = cc.internalDeviceId
                    ? childDeviceMap.get(cc.internalDeviceId)
                    : null;
                  const AssignedIcon = assignedSwitch
                    ? deviceIcons[assignedSwitch.type]
                    : null;

                  return (
                    <div
                      key={cc.connectionId}
                      className="p-2.5 bg-card rounded-lg border hover:border-primary/30 transition-colors"
                    >
                      {/* Row 1: Remote device → cable name → line type */}
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="p-1 rounded shrink-0"
                          style={{
                            backgroundColor: `${remoteColor}15`,
                          }}
                        >
                          <RemoteIcon
                            className="h-3.5 w-3.5"
                            style={{
                              color: remoteColor,
                            }}
                          />
                        </div>
                        <span
                          className="flex-1 text-xs font-medium truncate"
                          title={cc.remoteDevice.name}
                        >
                          {cc.remoteDevice.name}
                        </span>
                        <ArrowRight
                          className="h-3 w-3 shrink-0"
                          style={{ color: lineColor }}
                        />
                        {/* Cable name */}
                        {isEditable && onUpdateConnectionName ? (
                          <input
                            type="text"
                            value={cc.name || ""}
                            onChange={(e) =>
                              onUpdateConnectionName(
                                cc.connectionId,
                                e.target.value,
                              )
                            }
                            placeholder={t("rackCabin.cableNamePlaceholder")}
                            className="shrink-0 w-[100px] text-[10px] font-mono bg-muted/50 px-1.5 py-0.5 rounded border border-border hover:border-primary/50 focus:border-primary focus:outline-none transition-colors"
                          />
                        ) : (
                          cc.name && (
                            <span
                              className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-muted/50 text-muted-foreground"
                              title={cc.name}
                            >
                              {cc.name}
                            </span>
                          )
                        )}
                        <span
                          className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium"
                          style={{
                            backgroundColor: `${lineColor}15`,
                            color: lineColor,
                          }}
                          title={LINE_TYPE_LABEL_KEYS[lineType] ? t(LINE_TYPE_LABEL_KEYS[lineType]) : lineType}
                        >
                          {lineType}
                        </span>
                      </div>

                      {/* Row 2: Switch selector + Cabinet port */}
                      <div className="flex items-center gap-2">
                        {/* Switch selector */}
                        <div className="flex-1 min-w-0">
                          {isEditable &&
                          onUpdateConnectionInternalDevice &&
                          switches.length > 0 ? (
                            <Select
                              value={cc.internalDeviceId ?? "__none__"}
                              onValueChange={(val) => {
                                onUpdateConnectionInternalDevice(
                                  cc.connectionId,
                                  cabinetId,
                                  val === "__none__" ? null : val,
                                );
                              }}
                            >
                              <SelectTrigger
                                size="sm"
                                className="w-full text-xs h-7 px-2 [&>svg]:size-3"
                              >
                                <SelectValue placeholder={t("rackCabin.selectDevice")} />
                              </SelectTrigger>
                              <SelectContent className="z-10000">
                                <SelectItem value="__none__">
                                  <span className="text-muted-foreground">
                                    {t("rackCabin.notAssigned")}
                                  </span>
                                </SelectItem>
                                {switches.map((sw) => {
                                  const SwIcon = deviceIcons[sw.type];
                                  return (
                                    <SelectItem key={sw.id} value={sw.id}>
                                      <div className="flex items-center gap-2">
                                        <SwIcon
                                          className="h-3.5 w-3.5 shrink-0"
                                          style={{
                                            color: deviceColors[sw.type],
                                          }}
                                        />
                                        <span>
                                          {sw.name}
                                        </span>
                                      </div>
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          ) : assignedSwitch && AssignedIcon ? (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-muted/30 rounded">
                              <AssignedIcon
                                className="h-3 w-3 shrink-0"
                                style={{
                                  color: deviceColors[assignedSwitch.type],
                                }}
                              />
                              <span className="text-xs font-medium truncate">
                                {assignedSwitch.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground/60 px-2 py-1">
                              {t("rackCabin.noDeviceAssigned")}
                            </span>
                          )}
                        </div>

                        {/* Cabinet port number */}
                        <div className="shrink-0 w-[60px]">
                          {isEditable && onUpdateConnectionPort ? (
                            <input
                              type="number"
                              min={1}
                              value={cc.port ?? ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                onUpdateConnectionPort(
                                  cc.connectionId,
                                  cabinetId,
                                  val ? parseInt(val, 10) : null,
                                );
                              }}
                              placeholder={t("rackCabin.portPlaceholder")}
                              title={t("rackCabin.cabinetPort")}
                              className="w-full text-xs font-mono bg-muted/50 px-2 py-1.5 rounded border border-border hover:border-primary/50 focus:border-primary focus:outline-none transition-colors text-center"
                            />
                          ) : (
                            <span
                              className="inline-flex items-center justify-center w-full font-mono px-2 py-1 rounded text-xs font-medium"
                              style={{
                                backgroundColor: `${lineColor}15`,
                                color: lineColor,
                              }}
                              title={t("rackCabin.cabinetPort")}
                            >
                              {cc.port != null ? `P:${cc.port}` : "—"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Power Connections (Electric Cables → UPS) */}
          {powerConnections.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-red-500" />
                <h4 className="text-sm font-medium text-muted-foreground">
                  {t("rackCabin.powerConnections")}
                </h4>
                <span className="text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-full">
                  {powerConnections.length}
                </span>
              </div>
              <div className="space-y-2">
                {powerConnections.map((cc) => {
                  const RemoteIcon =
                    deviceIcons[cc.remoteDevice.type as DeviceType] ??
                    infrastructureIcons[cc.remoteDevice.type as InfrastructureType];
                  const remoteColor =
                    deviceColors[cc.remoteDevice.type as DeviceType] ??
                    infrastructureColors[cc.remoteDevice.type as InfrastructureType] ??
                    COLOR_FALLBACK_HEX;
                  const lineColor =
                    cc.color && /^#[0-9A-Fa-f]{6}$/.test(cc.color)
                      ? cc.color
                      : CABLE_COLORS.electric;

                  // Resolve the assigned UPS
                  const assignedUps = cc.internalDeviceId
                    ? childDeviceMap.get(cc.internalDeviceId)
                    : null;
                  const AssignedIcon = assignedUps
                    ? deviceIcons[assignedUps.type]
                    : null;

                  return (
                    <div
                      key={cc.connectionId}
                      className="p-2.5 bg-card rounded-lg border hover:border-red-500/30 transition-colors"
                    >
                      {/* Row 1: Remote device → cable name → electric badge */}
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="p-1 rounded shrink-0"
                          style={{
                            backgroundColor: `${remoteColor}15`,
                          }}
                        >
                          <RemoteIcon
                            className="h-3.5 w-3.5"
                            style={{ color: remoteColor }}
                          />
                        </div>
                        <span
                          className="flex-1 text-xs font-medium truncate"
                          title={cc.remoteDevice.name}
                        >
                          {cc.remoteDevice.name}
                        </span>
                        <ArrowRight
                          className="h-3 w-3 shrink-0"
                          style={{ color: lineColor }}
                        />
                        {/* Cable name */}
                        {isEditable && onUpdateConnectionName ? (
                          <input
                            type="text"
                            value={cc.name || ""}
                            onChange={(e) =>
                              onUpdateConnectionName(
                                cc.connectionId,
                                e.target.value,
                              )
                            }
                            placeholder={t("rackCabin.cableNamePlaceholder")}
                            className="shrink-0 w-[100px] text-[10px] font-mono bg-muted/50 px-1.5 py-0.5 rounded border border-border hover:border-primary/50 focus:border-primary focus:outline-none transition-colors"
                          />
                        ) : (
                          cc.name && (
                            <span
                              className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-muted/50 text-muted-foreground"
                              title={cc.name}
                            >
                              {cc.name}
                            </span>
                          )
                        )}
                        <span
                          className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium"
                          style={{
                            backgroundColor: `${lineColor}15`,
                            color: lineColor,
                          }}
                        >
                          electric
                        </span>
                        {/* electric badge is a fixed cable-type code, not UI copy */}
                      </div>

                      {/* Row 2: UPS selector */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          {isEditable &&
                          onUpdateConnectionInternalDevice &&
                          upsDevices.length > 0 ? (
                            <Select
                              value={cc.internalDeviceId ?? "__none__"}
                              onValueChange={(val) => {
                                onUpdateConnectionInternalDevice(
                                  cc.connectionId,
                                  cabinetId,
                                  val === "__none__" ? null : val,
                                );
                              }}
                            >
                              <SelectTrigger
                                size="sm"
                                className="w-full text-xs h-7 px-2 [&>svg]:size-3"
                              >
                                <SelectValue placeholder={t("rackCabin.selectUps")} />
                              </SelectTrigger>
                              <SelectContent className="z-10000">
                                <SelectItem value="__none__">
                                  <span className="text-muted-foreground">
                                    {t("rackCabin.notAssigned")}
                                  </span>
                                </SelectItem>
                                {upsDevices.map((ups) => {
                                  const UpsIcon = deviceIcons[ups.type];
                                  return (
                                    <SelectItem key={ups.id} value={ups.id}>
                                      <div className="flex items-center gap-2">
                                        <UpsIcon
                                          className="h-3.5 w-3.5 shrink-0"
                                          style={{
                                            color: deviceColors[ups.type],
                                          }}
                                        />
                                        <span>{ups.name}</span>
                                      </div>
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          ) : assignedUps && AssignedIcon ? (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-muted/30 rounded">
                              <AssignedIcon
                                className="h-3 w-3 shrink-0"
                                style={{
                                  color: deviceColors[assignedUps.type],
                                }}
                              />
                              <span className="text-xs font-medium truncate">
                                {assignedUps.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground/60 px-2 py-1">
                              {upsDevices.length === 0
                                ? t("rackCabin.noUpsInCabinet")
                                : t("rackCabin.noUpsAssigned")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
