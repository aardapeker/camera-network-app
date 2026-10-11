import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState, useCallback, useMemo, type Dispatch, type SetStateAction } from "react";
import { useParams, useNavigate, useLocation, useBlocker } from "react-router";
import { MapContainer, ImageOverlay } from "react-leaflet";
import L from "leaflet";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import i18n from "~/lib/i18n";
import { useTypeLabels } from "~/hooks/use-type-labels";
import { Menu, X, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { ContextMenuProvider } from "~/contexts/context-menu-context";
import {
  deviceLabels,
  deviceColors,
  DeviceType,
  InfrastructureType,
  infrastructureLabels,
  infrastructureColors,
  DraggableDevice,
  DraggableInfrastructure,
  socketLabels,
  socketColors,
  DraggableSocket,
  SocketType,
  type LabelPosition,
  SIDEBAR_DRAG_START_EVENT,
} from "~/components/icons";
import { LeafletToolbar } from "~/components/leaflet-editor/toolbar";
import { ConnectionGroup } from "~/components/leaflet-editor/connection-line";
import { DeviceMarker } from "~/components/leaflet-editor/device-marker";
import { RackCabinMarker } from "~/components/leaflet-editor/rack-cabin-marker";
import { WorkstationMarker } from "~/components/leaflet-editor/workstation-marker";
import { SocketMarker } from "~/components/leaflet-editor/socket-marker";
import { RackCabinDetailDrawer } from "~/components/rack-cabin-detail-drawer";
import { WorkstationDetailDrawer } from "~/components/workstation-detail-drawer";
import { MapController, ZoomController, MapEvents, AlignmentGuides } from "~/components/map";
import { DEFAULT_BOUNDS } from "~/constants/topology";
import { generateId, getNextIncrementalName, getNextDeviceName, getNextDeviceIp } from "~/lib/line-geometry";
import getCurrentUser from "~/functions/get_current_user";
import saveTopology from "~/functions/save_topology";
import updateTopology from "~/functions/update_topology";
import { usePdfExport } from "~/hooks/use-pdf-export";
import getTopologiesByClient from "~/functions/get_topologies_by_client";
import getTopologyById from "~/functions/get_topology_by_id"
import getSettings from "~/functions/get_settings";
import {
  getSettingsPrefixes,
  buildInitialProjectDefaults,
  unflattenProjectDefaults,
  flattenProjectDefaults,
  deviceTypeHasIp,
  type DeviceTypePrefixes,
  type ProjectDeviceDefaultsMap,
} from "~/lib/device-defaults";
import { ProjectDefaultsDialog } from "~/components/project-defaults-dialog";
import type {
  TopologyDevice,
  TopologyConnection,
  TopologyRackCabin,
  TopologyWorkstation,
  TopologySocket,
  LineType,
} from "~/types";
import { CustomPermission } from "~/types";
import type {
  LeafletDevice,
  LeafletSocket,
  LeafletInfrastructure,
} from "~/types/topology";

// ─── Undo/Redo History ────────────────────────────────────────────────────────

interface HistorySnapshot {
  devices: LeafletDevice[];
  sockets: LeafletSocket[];
  infrastructure: LeafletInfrastructure[];
  connections: TopologyConnection[];
}

const HISTORY_LIMIT = 50;

function useHistory() {
  const past = useRef<HistorySnapshot[]>([]);
  const future = useRef<HistorySnapshot[]>([]);
  const current = useRef<HistorySnapshot>({
    devices: [],
    sockets: [],
    infrastructure: [],
    connections: [],
  });

  const push = useCallback((snapshot: HistorySnapshot) => {
    past.current.push(snapshot);
    if (past.current.length > HISTORY_LIMIT) past.current.shift();
    future.current = [];
    // NOTE: do NOT set current.current here — it tracks post-mutation state
    // and is updated only by undo/redo.
  }, []);

  const undo = useCallback(
    (
      setDevices: Dispatch<SetStateAction<LeafletDevice[]>>,
      setSockets: Dispatch<SetStateAction<LeafletSocket[]>>,
      setInfrastructure: Dispatch<SetStateAction<LeafletInfrastructure[]>>,
      setConnections: Dispatch<SetStateAction<TopologyConnection[]>>,
      setHasUnsavedChanges: Dispatch<SetStateAction<boolean>>,
      currentSnapshot: HistorySnapshot,
    ) => {
      if (past.current.length === 0) return;
      const previous = past.current.pop()!;
      future.current.push(currentSnapshot);
      current.current = previous;
      setDevices(previous.devices);
      setSockets(previous.sockets);
      setInfrastructure(previous.infrastructure);
      setConnections(previous.connections);
      setHasUnsavedChanges(true);
    },
    [],
  );

  const redo = useCallback(
    (
      setDevices: Dispatch<SetStateAction<LeafletDevice[]>>,
      setSockets: Dispatch<SetStateAction<LeafletSocket[]>>,
      setInfrastructure: Dispatch<SetStateAction<LeafletInfrastructure[]>>,
      setConnections: Dispatch<SetStateAction<TopologyConnection[]>>,
      setHasUnsavedChanges: Dispatch<SetStateAction<boolean>>,
      currentSnapshot: HistorySnapshot,
    ) => {
      if (future.current.length === 0) return;
      const next = future.current.pop()!;
      past.current.push(currentSnapshot);
      current.current = next;
      setDevices(next.devices);
      setSockets(next.sockets);
      setInfrastructure(next.infrastructure);
      setConnections(next.connections);
      setHasUnsavedChanges(true);
    },
    [],
  );

  return { push, undo, redo, past, future, current };
}

// ─────────────────────────────────────────────────────────────────────────────

export default function TopologyEditorPage() {
  const { topologyId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { deviceLabels: tDeviceLabels } = useTypeLabels();

  const [devices, setDevices] = useState<LeafletDevice[]>([]);
  const [sockets, setSockets] = useState<LeafletSocket[]>([]);
  const [infrastructure, setInfrastructure] = useState<LeafletInfrastructure[]>(
    [],
  );
  const [connections, setConnections] = useState<TopologyConnection[]>([]);

  const history = useHistory();
  const captureSnapshot = useCallback(
    (): HistorySnapshot => ({ devices, sockets, infrastructure, connections }),
    [devices, sockets, infrastructure, connections],
  );
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [selectedInfrastructureId, setSelectedInfrastructureId] = useState<
    string | null
  >(null);
  const [connectionMode, setConnectionMode] = useState(false);
  const [pendingConnectionSource, setPendingConnectionSource] = useState<
    string | null
  >(null);

  const [clientUsernames, setClientUsernames] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<{
    username: string;
    isClient: boolean;
    role: string;
    customPermissions?: CustomPermission[];
  } | null>(null);

  const isClientRoute = currentUser?.isClient === true;
  const editorBasePath = "/topology-editor";

  const [blueprintUrl, setBlueprintUrl] = useState<string | null>(null);
  const [imageBounds, setImageBounds] =
    useState<L.LatLngBoundsExpression>(DEFAULT_BOUNDS);
  const [zoom, setZoom] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChangesState] = useState(false);
  const hasUnsavedChangesRef = useRef(false);
  const setHasUnsavedChanges: Dispatch<SetStateAction<boolean>> = useCallback(
    (value) => {
      // The ref must be written here, in the setter body, NOT inside the
      // updater passed to setHasUnsavedChangesState — React defers updater
      // callbacks to the render pass, so the ref would still hold the stale
      // value when navigate() runs immediately after a save.
      const next =
        typeof value === "function" ? value(hasUnsavedChangesRef.current) : value;
      hasUnsavedChangesRef.current = next;
      setHasUnsavedChangesState(next);
    },
    [],
  );
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [settingsPrefixes, setSettingsPrefixes] = useState<DeviceTypePrefixes>(deviceLabels);
  const [projectDefaults, setProjectDefaults] = useState<ProjectDeviceDefaultsMap>(() =>
    buildInitialProjectDefaults(deviceLabels),
  );
  const [showProjectDefaultsDialog, setShowProjectDefaultsDialog] = useState(false);

  useEffect(() => {
    getSettings()
      .then((s) => {
        setAutoSaveEnabled(s.autoSaveEnabled);
        const prefixes = getSettingsPrefixes(s);
        setSettingsPrefixes(prefixes);
        // Only re-seed a brand-new project's defaults from Settings — an existing
        // topology's defaults are hydrated from its own saved values in loadTopology().
        if (!topologyId) {
          setProjectDefaults(buildInitialProjectDefaults(prefixes));
        }
      })
      .catch(() => {}); // silently ignore — auto-save/prefixes stay at built-in defaults
  }, [topologyId]);

  // Warn on browser tab close / refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Warn on in-app navigation (React Router)
  // Reads the ref (updated synchronously) instead of the hasUnsavedChanges state,
  // since navigate() after a save can fire before the state update has flushed.
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasUnsavedChangesRef.current && currentLocation.pathname !== nextLocation.pathname,
  );

  const [isEditMode, setIsEditMode] = useState(false);
  const [topologyName, setTopologyName] = useState<string>("");
  const [isLoadingTopology, setIsLoadingTopology] = useState(false);
  const loadedTopologyIdRef = useRef<string | null>(null);

  const exportDevices = useMemo(() => devices.map((d) => ({
    id: d.id,
    deviceId: d.id,
    type: d.type,
    label: d.name,
    lat: d.lat,
    lng: d.lng,
    rotation: d.rotation,
    color: d.color,
    note: d.note,
    flipX: d.flipX,
    flipY: d.flipY,
    ipAddress: d.ipAddress,
    rackCabinId: d.rackCabinId,
    orderIndex: d.orderIndex,
    labelPosition: d.labelPosition,
  })), [devices]);

  const { isExporting, handleExportPdf } = usePdfExport({
    selectedTopology: topologyId ? { id: topologyId, name: topologyName, createdAt: "" } : null,
    clientUsername: clientUsernames[0] ?? "",
    devices: exportDevices,
    infrastructure: infrastructure.map((i) => ({
      id: i.id,
      infraId: i.id,
      type: i.type,
      label: i.label,
      lat: i.lat,
      lng: i.lng,
      rotation: i.rotation,
      color: i.color,
      note: i.note,
      flipX: i.flipX,
      flipY: i.flipY,
      labelPosition: i.labelPosition,
    })),
    sockets: sockets.map((s) => ({
      id: s.id,
      socketId: s.id,
      type: s.type,
      label: s.name,
      lat: s.lat,
      lng: s.lng,
      color: s.color,
      note: s.note,
      workstationId: s.workstationId,
      orderIndex: s.orderIndex,
      labelPosition: s.labelPosition,
    })),
    connections,
    blueprintUrl,
    imageBounds,
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);


  // Close the sidebar when a drag starts from a sidebar item (touch or mouse).
  // This exposes the map on small screens so the drop can land on it.
  useEffect(() => {
    const handler = () => setIsSidebarOpen(false);
    window.addEventListener(SIDEBAR_DRAG_START_EVENT, handler);
    return () => window.removeEventListener(SIDEBAR_DRAG_START_EVENT, handler);
  }, []);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCabinetId, setSelectedCabinetId] = useState<string | null>(
    null,
  );

  const [workstationDrawerOpen, setWorkstationDrawerOpen] = useState(false);
  const [selectedWorkstationId, setSelectedWorkstationId] = useState<
    string | null
  >(null);

  // Load current user
  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await getCurrentUser();

        // CUSTOM users without CREATE_TOPOLOGY cannot create new topologies
        const isCustom = user.role === "ROLE_CUSTOM";
        const hasCreate = user.customPermissions?.includes(CustomPermission.CREATE_TOPOLOGY);
        const hasEditClientAssigned = user.customPermissions?.includes(CustomPermission.EDIT_CLIENT_ASSIGNED);
        if (isCustom && !hasCreate && !hasEditClientAssigned) {
          navigate("/home");
          return;
        }
        // CUSTOM with only EDIT_CLIENT_ASSIGNED cannot create new topologies (no topologyId)
        if (isCustom && !hasCreate && hasEditClientAssigned && !topologyId) {
          navigate("/home");
          return;
        }

        setCurrentUser({
          username: user.username,
          isClient: user.isClient || false,
          role: user.role || "",
          customPermissions: user.customPermissions,
        });
        if (isClientRoute && user.isClient && user.username) {
          setClientUsernames([user.username]);
        }
      } catch {
        // User not loaded
      }
    };
    loadUser();
  }, [isClientRoute, navigate]);

  const [boundsReady, setBoundsReady] = useState(false);

  // Calculate bounds when blueprint is loaded
  useEffect(() => {
    if (!blueprintUrl) {
      setBoundsReady(false);
      return;
    }
    setBoundsReady(false);
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      const aspectRatio = img.width / img.height;
      const height = 800;
      setImageBounds([[0, 0], [height, height * aspectRatio]]);
      setBoundsReady(true);
    };
    img.onerror = () => {
      if (cancelled) return;
      setBoundsReady(true);
    };
    img.src = blueprintUrl;
    return () => {
      cancelled = true;
      img.onload = null;
      img.onerror = null;
    };
  }, [blueprintUrl]);

  // Load existing topology when in edit mode
  useEffect(() => {
    if (!topologyId) {
      setIsEditMode(false);
      setDevices([]);
      setSockets([]);
      setInfrastructure([]);
      setConnections([]);
      setTopologyName("");
      loadedTopologyIdRef.current = null;
      // Pre-fill blueprint from PDF import if passed as query param
      const sp = new URLSearchParams(window.location.search);
      const blueprintParam = sp.get("blueprint");
      const clientParam = sp.get("client");
      if (blueprintParam) {
        setBlueprintUrl(blueprintParam);
        if (clientParam) setClientUsernames([clientParam]);
      } else {
        setBlueprintUrl(null);
      }
      return;
    }

    const loadTopology = async () => {
      if (loadedTopologyIdRef.current === topologyId) return;
      loadedTopologyIdRef.current = topologyId;
      setIsLoadingTopology(true);
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const clientParam = searchParams.get("client");
        const finalClientParam =
          clientParam ||
          (isClientRoute && currentUser?.isClient
            ? currentUser.username
            : null);

        let topology;
        if (!finalClientParam) {
          // Staff user opening topology directly by ID (no client param)
          if (isClientRoute) {
            toast.error(i18n.t("editorPage.clientMissing"));
            navigate("/home");
            return;
          }
          topology = await getTopologyById(topologyId);
          // Block TECH and MODERATOR users from editing client-assigned topologies
          const restrictedRoles = ["ROLE_TECH", "ROLE_MODERATOR"];
          if (topology.clientUsernames?.length && restrictedRoles.includes(currentUser?.role ?? "")) {
            toast.error(i18n.t("editorPage.cannotEditClientAssigned"));
            navigate("/topologies");
            return;
          }
          if (topology.clientUsernames?.length) {
            setClientUsernames(topology.clientUsernames);
          }
        } else {
          // Block TECH and MODERATOR users from accessing client-assigned topologies via client param
          const restrictedRoles = ["ROLE_TECH", "ROLE_MODERATOR"];
          if (restrictedRoles.includes(currentUser?.role ?? "")) {
            toast.error(i18n.t("editorPage.cannotEditClientAssigned"));
            navigate("/topologies");
            return;
          }
          const topologies = await getTopologiesByClient(finalClientParam);
          topology = topologies.find((t) => t.id === topologyId);
          // Use all assigned clients from the topology, not just the one from the URL param
          if (topology?.clientUsernames?.length) {
            setClientUsernames(topology.clientUsernames);
          } else {
            setClientUsernames([finalClientParam]);
          }
        }

        if (!topology) {
          toast.error(i18n.t("editorPage.topologyNotFound"));
          navigate(editorBasePath);
          return;
        }

        setIsEditMode(true);
        setTopologyName(topology.name);
        setBlueprintUrl(topology.blueprintPictureUrl);

        // Hydrate per-project naming/IP defaults from a freshly-fetched Settings snapshot,
        // so a prefix override that's null (i.e. "follow Settings") resolves correctly here
        // regardless of whether the component-level settingsPrefixes state has loaded yet.
        const loadedSettings = await getSettings().catch(() => null);
        const loadedPrefixes = loadedSettings ? getSettingsPrefixes(loadedSettings) : settingsPrefixes;
        if (loadedSettings) setSettingsPrefixes(loadedPrefixes);
        setProjectDefaults(unflattenProjectDefaults(topology, loadedPrefixes));

        // Build a deviceId -> rackCabinId map from cabin.devices (source of truth).
        const deviceRackCabinMap = new Map<string, string>();
        const cabinDeviceIds = new Set<string>();
        const cabinDeviceKeys = new Set<string>(); // "label:deviceType" for orphan detection
        (topology.rackCabins || []).forEach((cabin) => {
          (cabin.devices || []).forEach((dev) => {
            deviceRackCabinMap.set(dev.deviceId, cabin.rackCabinId);
            cabinDeviceIds.add(dev.deviceId);
            cabinDeviceKeys.add(`${dev.label}:${dev.deviceType}`);
          });
        });

        // Convert devices, excluding orphaned entries: devices with rackCabinId=null
        // that are not in cabin.devices but share label+type with a cabin device.
        // These are corrupted duplicates from a previous lazy-loading bug.
        const loadedDevices: LeafletDevice[] = (topology.devices || [])
          .filter((dev) => {
            if (dev.rackCabinId || cabinDeviceIds.has(dev.deviceId)) return true;
            if (cabinDeviceKeys.has(`${dev.label}:${dev.deviceType}`)) return false;
            return true;
          })
          .map((dev) => ({
            id: dev.deviceId,
            name: dev.label,
            type: dev.deviceType as DeviceType,
            lat: dev.positionY,
            lng: dev.positionX,
            rotation: dev.rotation,
            color: dev.color,
            note: dev.note,
            flipX: dev.flipX,
            flipY: dev.flipY,
            ipAddress: dev.ipAddress || "192.168.1.1",
            rackCabinId: dev.rackCabinId || deviceRackCabinMap.get(dev.deviceId) || null,
            orderIndex: dev.orderIndex ?? null,
            labelPosition: (dev.labelPosition as LabelPosition) || null,
            brand: dev.brand || null,
            model: dev.model || null,
            serialNumber: dev.serialNumber || null,
            subtype: dev.subtype || null,
          }));
        setDevices(loadedDevices);

        // Convert connections
        const loadedConnections: TopologyConnection[] = (
          topology.connections || []
        ).map((conn) => ({
          id: conn.id,
          sourceDeviceId: conn.sourceDeviceId,
          targetDeviceId: conn.targetDeviceId,
          lineType: conn.lineType as LineType | undefined,
          color: conn.color ?? undefined,
          sourcePort: conn.sourcePort ?? null,
          targetPort: conn.targetPort ?? null,
          sourceInternalDeviceId: conn.sourceInternalDeviceId ?? null,
          targetInternalDeviceId: conn.targetInternalDeviceId ?? null,
          name: conn.name ?? null,
          waypoints: conn.waypoints ? JSON.parse(conn.waypoints) : null,
        }));
        setConnections(loadedConnections);

        // Convert infrastructure
        const loadedInfrastructure: LeafletInfrastructure[] = [];
        (topology.rackCabins || []).forEach((cabin) => {
          loadedInfrastructure.push({
            id: cabin.rackCabinId,
            label: cabin.label,
            type: InfrastructureType.RACK_CABIN,
            lat: cabin.positionY,
            lng: cabin.positionX,
            rotation: cabin.rotation,
            color: cabin.color,
            note: cabin.note,
            flipX: cabin.flipX,
            flipY: cabin.flipY,
            labelPosition: (cabin.labelPosition as LabelPosition) || null,
          });
        });
        (topology.workstations || []).forEach((ws) => {
          loadedInfrastructure.push({
            id: ws.workstationId,
            label: ws.label,
            type: InfrastructureType.WORKSTATION,
            lat: ws.positionY,
            lng: ws.positionX,
            rotation: ws.rotation,
            color: ws.color,
            note: ws.note,
            flipX: ws.flipX,
            flipY: ws.flipY,
            labelPosition: (ws.labelPosition as LabelPosition) || null,
          });
        });
        setInfrastructure(loadedInfrastructure);

        // Load sockets from workstations
        const workstationSockets: LeafletSocket[] = (
          topology.workstations || []
        ).flatMap((ws) =>
          (ws.sockets || []).map((soc) => ({
            id: soc.socketId,
            name: soc.label,
            type: soc.socketType as SocketType,
            lat: ws.positionY,
            lng: ws.positionX,
            rotation: 0,
            color: soc.color,
            note: soc.note,
            workstationId: ws.workstationId,
            orderIndex: soc.orderIndex ?? null,
            labelPosition: (soc.labelPosition as LabelPosition) || null,
          })),
        );

        // Load standalone sockets
        const standaloneSockets: LeafletSocket[] = (
          topology.sockets || []
        ).map((soc) => ({
          id: soc.socketId,
          name: soc.label,
          type: soc.socketType as SocketType,
          lat: soc.positionY ?? 0,
          lng: soc.positionX ?? 0,
          rotation: 0,
          color: soc.color,
          note: soc.note,
          workstationId: null,
          orderIndex: soc.orderIndex ?? null,
          labelPosition: (soc.labelPosition as LabelPosition) || null,
        }));

        setSockets([...workstationSockets, ...standaloneSockets]);

        // Reset undo/redo history so users can't undo past the loaded state
        history.past.current = [];
        history.future.current = [];
        history.current.current = {
          devices: loadedDevices,
          sockets: [...workstationSockets, ...standaloneSockets],
          infrastructure: loadedInfrastructure,
          connections: loadedConnections,
        };

        toast.success(i18n.t("editorPage.loadedTopology", { name: topology.name }));
      } catch {
        loadedTopologyIdRef.current = null;
        toast.error(i18n.t("editorPage.loadFailed"));
        navigate(isClientRoute ? "/home" : editorBasePath);
      } finally {
        setIsLoadingTopology(false);
      }
    };

    if (topologyId && currentUser) {
      loadTopology();
    }
  }, [topologyId, currentUser, isClientRoute, navigate]);

  // Device manipulation callbacks
  const addDevice = useCallback(
    (type: DeviceType, lat: number, lng: number, rackCabinId?: string) => {
      history.push(captureSnapshot());
      setDevices((prev) => {
        const sameType = prev.filter((d) => d.type === type);
        const existingNames = sameType.map((d) => d.name);
        const existingIps = sameType.map((d) => d.ipAddress);
        const defaults = projectDefaults[type];
        const newName = getNextDeviceName(
          defaults?.prefix ?? deviceLabels[type],
          defaults?.startNumber ?? 1,
          existingNames,
        );
        const orderIndex = rackCabinId
          ? Math.max(0, ...prev.filter((d) => d.rackCabinId === rackCabinId).map((d) => d.orderIndex ?? 0)) + 1
          : null;
        const newDevice: LeafletDevice = {
          id: generateId(),
          name: newName,
          type,
          lat,
          lng,
          rotation: 0,
          color: deviceColors[type],
          ipAddress: deviceTypeHasIp(type)
            ? getNextDeviceIp(defaults?.startIp ?? "192.168.1.1", existingIps)
            : null,
          rackCabinId: rackCabinId || null,
          orderIndex,
        };
        return [...prev, newDevice];
      });
      setHasUnsavedChanges(true);
      if (rackCabinId) {
        toast.success(i18n.t("editorPage.addedToRackCabin", { device: tDeviceLabels[type] }));
      }
    },
    [captureSnapshot, projectDefaults],
  );

  const addSocket = useCallback(
    (type: SocketType, lat: number, lng: number, workstationId?: string | null) => {
      history.push(captureSnapshot());
      setSockets((prev) => {
        // For naming, filter by workstationId if provided, otherwise filter standalone sockets
        const existingNames = workstationId
          ? prev.filter((s) => s.workstationId === workstationId).map((s) => s.name)
          : prev.filter((s) => !s.workstationId).map((s) => s.name);
        const newName = getNextIncrementalName(
          socketLabels[type],
          existingNames,
        );
        const orderIndex = workstationId
          ? Math.max(0, ...prev.filter((s) => s.workstationId === workstationId).map((s) => s.orderIndex ?? 0)) + 1
          : null;
        return [
          ...prev,
          {
            id: generateId(),
            name: newName,
            type,
            lat,
            lng,
            rotation: 0,
            color: socketColors[type],
            workstationId: workstationId || null,
            orderIndex,
          },
        ];
      });
      setHasUnsavedChanges(true);
    },
    [captureSnapshot],
  );

  const addInfrastructure = useCallback(
    (type: InfrastructureType, lat: number, lng: number) => {
      history.push(captureSnapshot());
      setInfrastructure((prev) => {
        const existingNames = prev
          .filter((i) => i.type === type)
          .map((i) => i.label);
        const newName = getNextIncrementalName(
          infrastructureLabels[type],
          existingNames,
        );
        const newInfra: LeafletInfrastructure = {
          id: generateId(),
          label: newName,
          type,
          lat,
          lng,
          rotation: 0,
          color: infrastructureColors[type],
        };
        return [...prev, newInfra];
      });
      setHasUnsavedChanges(true);
    },
    [captureSnapshot],
  );

  const moveDevice = useCallback((id: string, lat: number, lng: number) => {
    history.push(captureSnapshot());
    setDevices((prev) =>
      prev.map((d) => (d.id === id ? { ...d, lat, lng } : d)),
    );
    setHasUnsavedChanges(true);
  }, [captureSnapshot]);

  const removeDevice = useCallback(
    (id: string) => {
      history.push(captureSnapshot());
      setDevices((prev) => prev.filter((d) => d.id !== id));
      setConnections((prev) =>
        prev.filter((c) => c.sourceDeviceId !== id && c.targetDeviceId !== id),
      );
      if (selectedDeviceId === id) setSelectedDeviceId(null);
      setHasUnsavedChanges(true);
    },
    [selectedDeviceId, captureSnapshot],
  );

  const rotateDevice = useCallback((id: string, degrees: number) => {
    history.push(captureSnapshot());
    setDevices((prev) =>
      prev.map((d) =>
        d.id === id
          ? { ...d, rotation: (d.rotation + degrees + 360) % 360 }
          : d,
      ),
    );
    setHasUnsavedChanges(true);
  }, [captureSnapshot]);

  const setDeviceRotation = useCallback((id: string, degrees: number) => {
    history.push(captureSnapshot());
    setDevices((prev) =>
      prev.map((d) => (d.id === id ? { ...d, rotation: degrees } : d)),
    );
    setHasUnsavedChanges(true);
  }, [captureSnapshot]);

  const updateDeviceNote = useCallback((id: string, note: string) => {
    history.push(captureSnapshot());
    setDevices((prev) => prev.map((d) => (d.id === id ? { ...d, note } : d)));
    setHasUnsavedChanges(true);
  }, [captureSnapshot]);

  const updateSocketNote = useCallback((id: string, note: string) => {
    history.push(captureSnapshot());
    setSockets((prev) => prev.map((s) => (s.id === id ? { ...s, note } : s)));
    setHasUnsavedChanges(true);
  }, [captureSnapshot]);

  const flipDeviceX = useCallback((id: string) => {
    history.push(captureSnapshot());
    setDevices((prev) =>
      prev.map((d) => (d.id === id ? { ...d, flipX: !d.flipX } : d)),
    );
    setHasUnsavedChanges(true);
  }, [captureSnapshot]);

  const flipDeviceY = useCallback((id: string) => {
    history.push(captureSnapshot());
    setDevices((prev) =>
      prev.map((d) => (d.id === id ? { ...d, flipY: !d.flipY } : d)),
    );
    setHasUnsavedChanges(true);
  }, [captureSnapshot]);

  const updateDeviceLabel = useCallback((id: string, newLabel: string) => {
    history.push(captureSnapshot());
    setDevices((prev) =>
      prev.map((d) => (d.id === id ? { ...d, name: newLabel } : d)),
    );
    setHasUnsavedChanges(true);
  }, [captureSnapshot]);

  const updateSocketLabel = useCallback((id: string, newLabel: string) => {
    history.push(captureSnapshot());
    setSockets((prev) =>
      prev.map((s) => (s.id === id ? { ...s, name: newLabel } : s)),
    );
    setHasUnsavedChanges(true);
  }, [captureSnapshot]);

  const updateDeviceIp = useCallback((id: string, ip: string) => {
    history.push(captureSnapshot());
    setDevices((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ipAddress: ip } : d)),
    );
    setHasUnsavedChanges(true);
  }, [captureSnapshot]);

  const updateDeviceBrand = useCallback((id: string, brand: string) => {
    setDevices((prev) =>
      prev.map((d) => (d.id === id ? { ...d, brand } : d)),
    );
    setHasUnsavedChanges(true);
  }, []);

  const updateDeviceModel = useCallback((id: string, model: string) => {
    setDevices((prev) =>
      prev.map((d) => (d.id === id ? { ...d, model } : d)),
    );
    setHasUnsavedChanges(true);
  }, []);

  const updateDeviceSerialNumber = useCallback((id: string, serialNumber: string) => {
    setDevices((prev) =>
      prev.map((d) => (d.id === id ? { ...d, serialNumber } : d)),
    );
    setHasUnsavedChanges(true);
  }, []);

  const updateDeviceSubtype = useCallback((id: string, subtype: string | null) => {
    setDevices((prev) =>
      prev.map((d) => (d.id === id ? { ...d, subtype } : d)),
    );
    setHasUnsavedChanges(true);
  }, []);

  const updateDeviceColor = useCallback((id: string, color: string | null) => {
    history.push(captureSnapshot());
    setDevices((prev) =>
      prev.map((d) => (d.id === id ? { ...d, color } : d)),
    );
    setHasUnsavedChanges(true);
  }, [captureSnapshot]);

  const updateSocketColor = useCallback((id: string, color: string | null) => {
    history.push(captureSnapshot());
    setSockets((prev) =>
      prev.map((s) => (s.id === id ? { ...s, color } : s)),
    );
    setHasUnsavedChanges(true);
  }, [captureSnapshot]);

  const updateDeviceLabelPosition = useCallback((id: string, labelPosition: LabelPosition) => {
    history.push(captureSnapshot());
    setDevices((prev) =>
      prev.map((d) => (d.id === id ? { ...d, labelPosition } : d)),
    );
    setHasUnsavedChanges(true);
  }, [captureSnapshot]);

  const updateSocketLabelPosition = useCallback((id: string, labelPosition: LabelPosition) => {
    history.push(captureSnapshot());
    setSockets((prev) =>
      prev.map((s) => (s.id === id ? { ...s, labelPosition } : s)),
    );
    setHasUnsavedChanges(true);
  }, [captureSnapshot]);

  const updateInfrastructureColor = useCallback(
    (id: string, color: string | null) => {
      history.push(captureSnapshot());
      setInfrastructure((prev) =>
        prev.map((i) => (i.id === id ? { ...i, color } : i)),
      );
      setHasUnsavedChanges(true);
    },
    [captureSnapshot],
  );

  const updateInfrastructureLabelPosition = useCallback(
    (id: string, labelPosition: LabelPosition) => {
      history.push(captureSnapshot());
      setInfrastructure((prev) =>
        prev.map((i) => (i.id === id ? { ...i, labelPosition } : i)),
      );
      setHasUnsavedChanges(true);
    },
    [captureSnapshot],
  );

  const removeDeviceFromRackCabin = useCallback((id: string) => {
    history.push(captureSnapshot());
    setDevices((prev) => prev.filter((d) => d.id !== id));
    setConnections((prev) =>
      prev.filter((c) => c.sourceDeviceId !== id && c.targetDeviceId !== id),
    );
    setHasUnsavedChanges(true);
    toast.success(i18n.t("editorPage.deviceRemovedFromCabin"));
  }, [captureSnapshot]);

  const removeSocketFromWorkstation = useCallback((id: string) => {
    history.push(captureSnapshot());
    setSockets((prev) => prev.filter((s) => s.id !== id));
    setConnections((prev) =>
      prev.filter((c) => c.sourceDeviceId !== id && c.targetDeviceId !== id),
    );
    setHasUnsavedChanges(true);
    toast.success(i18n.t("editorPage.socketRemovedFromWorkstation"));
  }, [captureSnapshot]);

  const reorderRackCabinDevices = useCallback(
    (cabinetId: string, orderedDeviceIds: string[]) => {
      history.push(captureSnapshot());
      setDevices((prev) =>
        prev.map((d) => {
          if (d.rackCabinId !== cabinetId) return d;
          const newIndex = orderedDeviceIds.indexOf(d.id);
          return newIndex !== -1 ? { ...d, orderIndex: newIndex } : d;
        }),
      );
      setHasUnsavedChanges(true);
    },
    [captureSnapshot],
  );

  const reorderWorkstationSockets = useCallback(
    (workstationId: string, orderedSocketIds: string[]) => {
      history.push(captureSnapshot());
      setSockets((prev) =>
        prev.map((s) => {
          if (s.workstationId !== workstationId) return s;
          const newIndex = orderedSocketIds.indexOf(s.id);
          return newIndex !== -1 ? { ...s, orderIndex: newIndex } : s;
        }),
      );
      setHasUnsavedChanges(true);
    },
    [captureSnapshot],
  );

  // Standalone socket manipulation callbacks
  const moveSocket = useCallback((id: string, lat: number, lng: number) => {
    history.push(captureSnapshot());
    setSockets((prev) =>
      prev.map((s) => (s.id === id ? { ...s, lat, lng } : s)),
    );
    setHasUnsavedChanges(true);
  }, [captureSnapshot]);

  const removeSocket = useCallback((id: string) => {
    history.push(captureSnapshot());
    setSockets((prev) => prev.filter((s) => s.id !== id));
    setConnections((prev) =>
      prev.filter((c) => c.sourceDeviceId !== id && c.targetDeviceId !== id),
    );
    setHasUnsavedChanges(true);
  }, [captureSnapshot]);

  const rotateSocket = useCallback((id: string, degrees: number) => {
    history.push(captureSnapshot());
    setSockets((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, rotation: (s.rotation + degrees + 360) % 360 }
          : s,
      ),
    );
    setHasUnsavedChanges(true);
  }, [captureSnapshot]);

  const flipSocketX = useCallback((id: string) => {
    history.push(captureSnapshot());
    setSockets((prev) =>
      prev.map((s) => (s.id === id ? { ...s, flipX: !s.flipX } : s)),
    );
    setHasUnsavedChanges(true);
  }, [captureSnapshot]);

  const flipSocketY = useCallback((id: string) => {
    history.push(captureSnapshot());
    setSockets((prev) =>
      prev.map((s) => (s.id === id ? { ...s, flipY: !s.flipY } : s)),
    );
    setHasUnsavedChanges(true);
  }, [captureSnapshot]);

  const duplicateSocket = useCallback(
    (socketId: string) => {
      history.push(captureSnapshot());
      const socket = sockets.find((s) => s.id === socketId);
      if (!socket) return;
      const newSocket = {
        id: generateId(),
        name: `${socket.name} (copy)`,
        type: socket.type,
        lat: socket.lat + 30,
        lng: socket.lng + 30,
        rotation: socket.rotation,
        color: socket.color,
        note: socket.note,
        flipX: socket.flipX,
        flipY: socket.flipY,
        workstationId: socket.workstationId,
      };
      setSockets((prev) => [...prev, newSocket]);
      setHasUnsavedChanges(true);
      toast.success(i18n.t("editorPage.socketDuplicated"));
    },
    [sockets, captureSnapshot],
  );

  const duplicateDevice = useCallback(
    (deviceId: string) => {
      history.push(captureSnapshot());
      const device = devices.find((d) => d.id === deviceId);
      if (!device) return;
      const newDevice: LeafletDevice = {
        id: generateId(),
        name: `${device.name} (copy)`,
        type: device.type,
        lat: device.lat + 30,
        lng: device.lng + 30,
        rotation: device.rotation,
        color: device.color,
        note: device.note,
        flipX: device.flipX,
        flipY: device.flipY,
        ipAddress: device.ipAddress,
        brand: device.brand,
        model: device.model,
        serialNumber: device.serialNumber,
      };
      setDevices((prev) => [...prev, newDevice]);
      setHasUnsavedChanges(true);
      toast.success(i18n.t("editorPage.deviceDuplicated"));
    },
    [devices, captureSnapshot],
  );

  // Connection callbacks
  const addConnection = useCallback(
    (sourceId: string, targetId: string, lineType?: LineType) => {
      if (sourceId === targetId) return;
      history.push(captureSnapshot());

      // Default to electric cable when connecting to/from a UPS
      let finalLineType = lineType;
      if (!finalLineType) {
        const srcDevice = devices.find((d) => d.id === sourceId);
        const tgtDevice = devices.find((d) => d.id === targetId);
        if (srcDevice?.type === DeviceType.UPS || tgtDevice?.type === DeviceType.UPS) {
          finalLineType = "electric";
        }
      }

      setConnections((prev) => {
        const existingNames = prev
          .filter((c) => c.name)
          .map((c) => c.name as string);
        const newName = getNextIncrementalName("Line", existingNames);

        const newConnection: TopologyConnection = {
          id: generateId(),
          sourceDeviceId: sourceId,
          targetDeviceId: targetId,
          lineType: finalLineType,
          name: newName,
        };
        return [...prev, newConnection];
      });
      setHasUnsavedChanges(true);
      toast.success(i18n.t("editorPage.connectionCreated"));
    },
    [devices, captureSnapshot],
  );

  const removeConnection = useCallback((id: string) => {
    history.push(captureSnapshot());
    setConnections((prev) => prev.filter((c) => c.id !== id));
    setHasUnsavedChanges(true);
  }, [captureSnapshot]);

  const updateConnectionColor = useCallback(
    (id: string, color: string | null) => {
      history.push(captureSnapshot());
      setConnections((prev) =>
        prev.map((c) => (c.id === id ? { ...c, color } : c)),
      );
      setHasUnsavedChanges(true);
    },
    [captureSnapshot],
  );

  const updateConnectionName = useCallback(
    (connectionId: string, name: string) => {
      history.push(captureSnapshot());
      setConnections((prev) =>
        prev.map((c) => (c.id === connectionId ? { ...c, name } : c)),
      );
      setHasUnsavedChanges(true);
    },
    [captureSnapshot],
  );

  const updateConnectionWaypoints = useCallback(
    (connectionId: string, waypoints: [number, number][] | null) => {
      history.push(captureSnapshot());
      setConnections((prev) =>
        prev.map((c) =>
          c.id === connectionId ? { ...c, waypoints } : c,
        ),
      );
      setHasUnsavedChanges(true);
    },
    [captureSnapshot],
  );

  const updateConnectionPort = useCallback(
    (connectionId: string, deviceId: string, port: number | null) => {
      history.push(captureSnapshot());
      setConnections((prev) =>
        prev.map((c) => {
          if (c.id !== connectionId) return c;
          if (c.sourceDeviceId === deviceId) {
            return { ...c, sourcePort: port };
          }
          if (c.targetDeviceId === deviceId) {
            return { ...c, targetPort: port };
          }
          return c;
        }),
      );
      setHasUnsavedChanges(true);
    },
    [captureSnapshot],
  );

  const updateConnectionInternalDevice = useCallback(
    (
      connectionId: string,
      cabinetId: string,
      internalDeviceId: string | null,
    ) => {
      history.push(captureSnapshot());
      setConnections((prev) =>
        prev.map((c) => {
          if (c.id !== connectionId) return c;
          if (c.sourceDeviceId === cabinetId) {
            return { ...c, sourceInternalDeviceId: internalDeviceId };
          }
          if (c.targetDeviceId === cabinetId) {
            return { ...c, targetInternalDeviceId: internalDeviceId };
          }
          return c;
        }),
      );
      setHasUnsavedChanges(true);
    },
    [captureSnapshot],
  );

  // Infrastructure manipulation callbacks
  const moveInfrastructure = useCallback(
    (id: string, lat: number, lng: number) => {
      history.push(captureSnapshot());
      setInfrastructure((prev) =>
        prev.map((i) => (i.id === id ? { ...i, lat, lng } : i)),
      );
      setHasUnsavedChanges(true);
    },
    [captureSnapshot],
  );

  const removeInfrastructure = useCallback(
    (id: string) => {
      history.push(captureSnapshot());
      setInfrastructure((prev) => prev.filter((i) => i.id !== id));
      setConnections((prev) =>
        prev.filter((c) => c.sourceDeviceId !== id && c.targetDeviceId !== id),
      );
      if (selectedInfrastructureId === id) setSelectedInfrastructureId(null);
      setHasUnsavedChanges(true);
    },
    [selectedInfrastructureId, captureSnapshot],
  );

  const rotateInfrastructure = useCallback((id: string, degrees: number) => {
    history.push(captureSnapshot());
    setInfrastructure((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, rotation: (i.rotation + degrees + 360) % 360 }
          : i,
      ),
    );
    setHasUnsavedChanges(true);
  }, [captureSnapshot]);

  const updateInfrastructureNote = useCallback((id: string, note: string) => {
    history.push(captureSnapshot());
    setInfrastructure((prev) =>
      prev.map((i) => (i.id === id ? { ...i, note } : i)),
    );
    setHasUnsavedChanges(true);
  }, [captureSnapshot]);

  const updateInfrastructureLabel = useCallback(
    (id: string, newLabel: string) => {
      history.push(captureSnapshot());
      setInfrastructure((prev) =>
        prev.map((i) => (i.id === id ? { ...i, label: newLabel } : i)),
      );
      setHasUnsavedChanges(true);
    },
    [captureSnapshot],
  );

  const duplicateInfrastructure = useCallback(
    (infraId: string) => {
      history.push(captureSnapshot());
      const infra = infrastructure.find((i) => i.id === infraId);
      if (!infra) return;
      const newInfraId = generateId();
      const newInfra: LeafletInfrastructure = {
        id: newInfraId,
        label: `${infra.label} (copy)`,
        type: infra.type,
        lat: infra.lat + 30,
        lng: infra.lng + 30,
        rotation: infra.rotation,
        color: infra.color,
        note: infra.note,
        flipX: infra.flipX,
        flipY: infra.flipY,
      };
      setInfrastructure((prev) => [...prev, newInfra]);

      if (infra.type === InfrastructureType.RACK_CABIN) {
        const childDevices = devices.filter((d) => d.rackCabinId === infraId);
        if (childDevices.length > 0) {
          const newDevices: LeafletDevice[] = childDevices.map((d) => ({
            id: generateId(),
            name: d.name,
            type: d.type,
            lat: d.lat + 30,
            lng: d.lng + 30,
            rotation: d.rotation,
            color: d.color,
            note: d.note,
            flipX: d.flipX,
            flipY: d.flipY,
            ipAddress: d.ipAddress,
            rackCabinId: newInfraId,
            orderIndex: d.orderIndex,
            labelPosition: d.labelPosition,
            brand: d.brand,
            model: d.model,
            serialNumber: d.serialNumber,
          }));
          setDevices((prev) => [...prev, ...newDevices]);
        }
      } else if (infra.type === InfrastructureType.WORKSTATION) {
        const childSockets = sockets.filter((s) => s.workstationId === infraId);
        if (childSockets.length > 0) {
          const newSockets: LeafletSocket[] = childSockets.map((s) => ({
            id: generateId(),
            name: s.name,
            type: s.type,
            lat: s.lat + 30,
            lng: s.lng + 30,
            rotation: s.rotation,
            color: s.color,
            note: s.note,
            flipX: s.flipX,
            flipY: s.flipY,
            workstationId: newInfraId,
            orderIndex: s.orderIndex,
            labelPosition: s.labelPosition,
          }));
          setSockets((prev) => [...prev, ...newSockets]);
        }
      }

      setHasUnsavedChanges(true);
      toast.success(i18n.t("editorPage.infrastructureDuplicated"));
    },
    [infrastructure, devices, sockets, captureSnapshot],
  );

  // Click handlers
  const handleDeviceClick = useCallback(
    (deviceId: string) => {
      if (connectionMode) {
        if (pendingConnectionSource === null) {
          setPendingConnectionSource(deviceId);
          toast.info(i18n.t("editorPage.selectSecondDevice"));
        } else {
          addConnection(pendingConnectionSource, deviceId);
          setPendingConnectionSource(null);
        }
      } else {
        setSelectedDeviceId(deviceId === selectedDeviceId ? null : deviceId);
      }
    },
    [connectionMode, pendingConnectionSource, selectedDeviceId, addConnection],
  );

  const handleInfrastructureClick = useCallback(
    (infraId: string) => {
      if (connectionMode) {
        if (pendingConnectionSource === null) {
          setPendingConnectionSource(infraId);
          toast.info(i18n.t("editorPage.selectSecondItem"));
        } else {
          addConnection(pendingConnectionSource, infraId);
          setPendingConnectionSource(null);
        }
      } else {
        setSelectedInfrastructureId(
          infraId === selectedInfrastructureId ? null : infraId,
        );
        setSelectedDeviceId(null);
      }
    },
    [
      connectionMode,
      pendingConnectionSource,
      selectedInfrastructureId,
      addConnection,
    ],
  );

  const handleInfrastructureShiftClick = useCallback(
    (infraId: string) => {
      const infra = infrastructure.find((i) => i.id === infraId);
      if (infra?.type === InfrastructureType.RACK_CABIN) {
        setSelectedCabinetId(infraId);
        setDrawerOpen(true);
      } else if (infra?.type === InfrastructureType.WORKSTATION) {
        setSelectedWorkstationId(infraId);
        setWorkstationDrawerOpen(true);
      }
    },
    [infrastructure],
  );

  const toggleConnectionMode = useCallback(() => {
    setConnectionMode((prev) => !prev);
    setPendingConnectionSource(null);
    if (!connectionMode) {
      toast.info(i18n.t("editorPage.clickTwoDevices"));
    }
  }, [connectionMode]);

const handleBlueprintUploaded = useCallback((url: string) => {
    setBlueprintUrl(url);
    setHasUnsavedChanges(true);
  }, []);

  const handleBlueprintRemove = useCallback(() => {
    setBlueprintUrl(null);
    setHasUnsavedChanges(false);
  }, []);

  // Undo/Redo keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isEditMode) return;
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }
      const isCtrl = e.ctrlKey || e.metaKey;
      if (isCtrl && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        history.undo(setDevices, setSockets, setInfrastructure, setConnections, setHasUnsavedChanges, captureSnapshot());
      } else if (isCtrl && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        history.redo(setDevices, setSockets, setInfrastructure, setConnections, setHasUnsavedChanges, captureSnapshot());
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEditMode, history, captureSnapshot]);

  const handleSave = useCallback(async () => {
    if (!blueprintUrl) {
      toast.error(i18n.t("editorPage.uploadBlueprintFirst"));
      return;
    }
    if (clientUsernames.length === 0 && currentUser?.isClient) {
      toast.error(i18n.t("editorPage.selectClientFirst"));
      return;
    }

    setIsSaving(true);
    try {
      const topologyDevices: TopologyDevice[] = devices
        .filter((d) => !d.rackCabinId && !d.workstationId)
        .map((d) => ({
          id: d.id,
          type: d.type,
          position: { x: d.lng, y: d.lat },
          label: d.name,
          rotation: d.rotation,
          color: d.color,
          note: d.note,
          flipX: d.flipX,
          flipY: d.flipY,
          ipAddress: d.ipAddress,
          labelPosition: d.labelPosition,
          brand: d.brand,
          model: d.model,
          serialNumber: d.serialNumber,
          subtype: d.subtype,
        }));

      const topologyRackCabins: TopologyRackCabin[] = infrastructure
        .filter((i) => i.type === InfrastructureType.RACK_CABIN)
        .map((i) => ({
          id: i.id,
          position: { x: i.lng, y: i.lat },
          label: i.label,
          rotation: i.rotation,
          color: i.color,
          note: i.note,
          flipX: i.flipX,
          flipY: i.flipY,
          labelPosition: i.labelPosition,
          devices: devices
            .filter((d) => d.rackCabinId === i.id)
            .map((d) => ({
              id: d.id,
              type: d.type,
              position: { x: d.lng, y: d.lat },
              label: d.name,
              rotation: d.rotation,
              color: d.color,
              note: d.note,
              flipX: d.flipX,
              flipY: d.flipY,
              ipAddress: d.ipAddress,
              rackCabinId: d.rackCabinId,
              orderIndex: d.orderIndex,
              labelPosition: d.labelPosition,
              brand: d.brand,
              model: d.model,
              serialNumber: d.serialNumber,
              subtype: d.subtype,
            })),
        }));

      const topologyWorkstations: TopologyWorkstation[] = infrastructure
        .filter((i) => i.type === InfrastructureType.WORKSTATION)
        .map((i) => ({
          id: i.id,
          position: { x: i.lng, y: i.lat },
          label: i.label,
          rotation: i.rotation,
          color: i.color,
          note: i.note,
          flipX: i.flipX,
          flipY: i.flipY,
          labelPosition: i.labelPosition,
          sockets: sockets
            .filter((s) => s.workstationId === i.id)
            .map((s) => ({
              id: s.id,
              socketType: s.type,
              position: { x: s.lng, y: s.lat },
              label: s.name,
              rotation: s.rotation,
              color: s.color,
              note: s.note,
              flipX: s.flipX,
              flipY: s.flipY,
              workstationId: s.workstationId,
              orderIndex: s.orderIndex,
              labelPosition: s.labelPosition,
            })),
        }));

      // Standalone sockets (not attached to any workstation)
      const standaloneSockets: TopologySocket[] = sockets
        .filter((s) => !s.workstationId)
        .map((s) => ({
          id: s.id,
          socketType: s.type,
          position: { x: s.lng, y: s.lat },
          label: s.name,
          color: s.color,
          note: s.note,
          workstationId: null,
          labelPosition: s.labelPosition,
        }));

      if (isEditMode && topologyId) {
        const result = await updateTopology(
          topologyId,
          clientUsernames,
          blueprintUrl,
          topologyDevices,
          connections,
          topologyRackCabins,
          topologyWorkstations,
          standaloneSockets,
          topologyName || undefined,
          flattenProjectDefaults(projectDefaults),
        );
        setLastSavedAt(new Date());
        toast.success(i18n.t("editorPage.topologyUpdated"), {
          description: i18n.t("editorPage.updatedName", { name: result.name }),
        });
      } else {
        const result = await saveTopology(
          clientUsernames,
          blueprintUrl,
          topologyDevices,
          connections,
          topologyRackCabins,
          topologyWorkstations,
          standaloneSockets,
          topologyName || undefined,
          flattenProjectDefaults(projectDefaults),
        );
        setLastSavedAt(new Date());
        setHasUnsavedChanges(false);
        toast.success(i18n.t("editorPage.topologySaved"), {
          description: i18n.t("editorPage.savedName", { name: result.name }),
        });
        navigate(`/topology-view/${result.id}`, { replace: true });
        return;
      }

      setHasUnsavedChanges(false);
    } catch (error) {
      toast.error(isEditMode ? i18n.t("editorPage.updateFailed") : i18n.t("editorPage.saveFailed"), {
        description: error instanceof Error ? error.message : i18n.t("editorPage.unknownError"),
      });
    } finally {
      setIsSaving(false);
    }
  }, [
    blueprintUrl,
    clientUsernames,
    devices,
    infrastructure,
    sockets,
    connections,
    isEditMode,
    topologyId,
    topologyName,
  ]);

  // Auto-save: debounce 3s after any change, only when editing an existing topology
  useEffect(() => {
    if (!autoSaveEnabled) return;
    if (!isEditMode || !topologyId || !hasUnsavedChanges || isSaving) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      handleSave();
    }, 3000);
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [autoSaveEnabled, hasUnsavedChanges, isEditMode, topologyId, isSaving, handleSave]);

  const selectedDevice = useMemo(
    () => devices.find((d) => d.id === selectedDeviceId),
    [devices, selectedDeviceId],
  );

  // Helper for connection lines
  const findPosition = useCallback(
    (id: string): { lat: number; lng: number } | null => {
      const device = devices.find((d) => d.id === id);
      if (device) return { lat: device.lat, lng: device.lng };
      const infra = infrastructure.find((i) => i.id === id);
      if (infra) return { lat: infra.lat, lng: infra.lng };
      // Check standalone sockets
      const socket = sockets.find((s) => s.id === id && !s.workstationId);
      if (socket) return { lat: socket.lat, lng: socket.lng };
      return null;
    },
    [devices, infrastructure, sockets],
  );

  if (isLoadingTopology) {
    return (
      <div className="flex flex-col h-full w-full overflow-hidden bg-background items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t("editorPage.loadingTopology")}</p>
        </div>
      </div>
    );
  }

  return (
    <ContextMenuProvider>
    <div className="flex flex-col h-full w-full overflow-hidden bg-background">
      <LeafletToolbar
        clientUsernames={clientUsernames}
        onClientChange={setClientUsernames}
        blueprintUrl={blueprintUrl}
        onBlueprintUploaded={handleBlueprintUploaded}
        onBlueprintRemove={handleBlueprintRemove}
        connectionMode={connectionMode}
        onToggleConnectionMode={toggleConnectionMode}
        onSave={handleSave}
        isSaving={isSaving}
        hasUnsavedChanges={hasUnsavedChanges}
        lastSavedAt={autoSaveEnabled ? lastSavedAt : null}
        isEditMode={isEditMode}
        topologyName={topologyName}
        onTopologyNameChange={(name) => {
          setTopologyName(name);
          setHasUnsavedChanges(true);
        }}
        onUndo={() => history.undo(setDevices, setSockets, setInfrastructure, setConnections, setHasUnsavedChanges, captureSnapshot())}
        onRedo={() => history.redo(setDevices, setSockets, setInfrastructure, setConnections, setHasUnsavedChanges, captureSnapshot())}
        clientOptional={
          currentUser === null
            ? null
            : currentUser.role === "ROLE_TECH" ||
              (currentUser.role === "ROLE_CUSTOM" &&
                !currentUser.customPermissions?.includes(CustomPermission.ASSIGN_TO_CLIENT))
        }
        onExportPdf={topologyId ? handleExportPdf : undefined}
        isExporting={isExporting}
        exportImageBounds={imageBounds}
        exportDevices={exportDevices}
        isLocked={isLocked}
        onToggleLock={() => setIsLocked((v) => !v)}
        onEditProjectDefaults={() => setShowProjectDefaultsDialog(true)}
      />

      <ProjectDefaultsDialog
        open={showProjectDefaultsDialog}
        onOpenChange={setShowProjectDefaultsDialog}
        value={projectDefaults}
        settingsPrefixes={settingsPrefixes}
        onSave={(next) => {
          setProjectDefaults(next);
          setHasUnsavedChanges(true);
        }}
      />

      <div className="flex flex-1 overflow-hidden min-w-0 min-h-0">
        {/* Mobile Sidebar Toggle */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          onTouchEnd={(e) => {
            e.preventDefault();
            setIsSidebarOpen(!isSidebarOpen);
          }}
          className="md:hidden fixed bottom-6 left-4 z-1100 p-4 min-w-12 min-h-12 bg-primary text-primary-foreground rounded-full shadow-lg active:scale-95 transition-transform touch-manipulation"
          title={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {isSidebarOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>

        {/* Mobile Overlay */}
        {isSidebarOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-900"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Device Palette Sidebar */}
        <div
          className={`
            w-48 shrink-0 bg-background p-3 border-r border-border overflow-y-auto custom-scrollbar
            fixed md:relative inset-y-0 left-0 md:h-full z-1000 md:z-auto
            transform transition-transform duration-200 ease-in-out
            ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          `}
        >
          <h3 className="text-foreground text-sm font-medium mb-3">{t("editorPage.devices")}</h3>
          <div className="grid grid-cols-2 gap-2">
            {(Object.values(DeviceType) as DeviceType[]).map((type) => (
              <DraggableDevice key={type} type={type} />
            ))}
          </div>

          <h3 className="text-foreground text-sm font-medium mb-3 mt-4">
            {t("editorPage.infrastructure")}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {(Object.values(InfrastructureType) as InfrastructureType[]).map(
              (type) => (
                <DraggableInfrastructure key={type} type={type} />
              ),
            )}
          </div>

          <h3 className="text-foreground text-sm font-medium mb-3">{t("editorPage.sockets")}</h3>
          <div className="grid grid-cols-2 gap-2">
            {(Object.values(SocketType) as SocketType[]).map((type) => (
              <DraggableSocket key={type} type={type} />
            ))}
          </div>

          {connectionMode && (
            <div className="mt-4 p-2 bg-green-900/50 rounded text-green-300 text-xs">
              <p className="font-medium">{t("editorPage.connectionMode")}</p>
              <p className="mt-1">
                {pendingConnectionSource
                  ? t("editorPage.clickSecondDevice")
                  : t("editorPage.clickFirstDevice")}
              </p>
            </div>
          )}

          {selectedDevice && (
            <div className="mt-4 p-2 bg-card rounded text-muted-foreground text-xs">
              <p className="font-medium text-foreground mb-2">
                {t("editorPage.selectedDevice")}
              </p>
              <p>{t("editorPage.typeLabel", { type: tDeviceLabels[selectedDevice.type] })}</p>
              <p>{t("editorPage.nameLabel", { name: selectedDevice.name })}</p>
              <p>{t("editorPage.rotationLabel", { deg: selectedDevice.rotation })}</p>
              <div className="mt-2">
                <label className="block text-xs mb-1">{t("editorPage.noteLabel")}</label>
                <textarea
                  value={selectedDevice.note || ""}
                  onChange={(e) =>
                    updateDeviceNote(selectedDevice.id, e.target.value)
                  }
                  className="w-full bg-secondary text-foreground text-xs rounded p-1 resize-none border border-border"
                  rows={3}
                  placeholder={t("editorPage.addNote")}
                />
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => rotateDevice(selectedDevice.id, -5)}
                  className="flex-1 px-2 py-1.5 bg-secondary hover:bg-accent text-foreground text-xs rounded transition-colors"
                >
                  -5°
                </button>
                <button
                  onClick={() => rotateDevice(selectedDevice.id, 5)}
                  className="flex-1 px-2 py-1.5 bg-secondary hover:bg-accent text-foreground text-xs rounded transition-colors"
                >
                  +5°
                </button>
              </div>
              <button
                onClick={() => removeDevice(selectedDevice.id)}
                className="mt-2 w-full px-2 py-1.5 bg-destructive hover:bg-destructive/80 text-primary-foreground text-xs rounded transition-colors"
              >
                {t("editorPage.deleteDevice")}
              </button>
            </div>
          )}
        </div>

        {/* Map Container */}
        <div className="flex-1 min-w-0 relative bg-card">
          {/* Zoom indicator */}
          {blueprintUrl && (
            <div className="absolute top-2 right-2 z-1000 flex items-center gap-1">
              <div className="bg-background/80 border border-border rounded px-2 py-1 text-xs text-muted-foreground font-mono pointer-events-none">
                {Math.round(zoom * 100)}%
              </div>
              <button
                onClick={() => setZoom(1)}
                className="bg-background/80 border border-border rounded px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
                title={t("editorPage.zoomToPdf")}
              >
                PDF
              </button>
            </div>
          )}
          {!blueprintUrl ? (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <p className="text-lg mb-2">{t("editorPage.noBlueprint")}</p>
                <p className="text-sm">
                  {currentUser?.role === "ROLE_TECH"
                    ? t("editorPage.uploadToStartTech")
                    : t("editorPage.uploadToStart")}
                </p>
              </div>
            </div>
          ) : !boundsReady ? (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <MapContainer
              key={blueprintUrl}
              crs={L.CRS.Simple}
              bounds={imageBounds}
              maxBounds={imageBounds}
              maxBoundsViscosity={1.0}
              className="h-full w-full"
              style={{ background: "var(--background)" }}
              zoomSnap={0.25}
              zoomDelta={0.25}
              minZoom={-2}
              maxZoom={4}
            >
              <MapController bounds={imageBounds} />
              <ZoomController zoom={zoom} onZoomChange={setZoom} />
              <ImageOverlay url={blueprintUrl} bounds={imageBounds} />
              <MapEvents
                infrastructure={infrastructure}
                onAddDevice={addDevice}
                onAddSocket={addSocket}
                onAddInfrastructure={addInfrastructure}
                connectionMode={connectionMode}
                isLocked={isLocked}
                onClearSelection={() => {
                  setSelectedDeviceId(null);
                  setSelectedInfrastructureId(null);
                  document.dispatchEvent(new CustomEvent("deselectAllConnections"));
                }}
              />
              <AlignmentGuides
                allPositions={[
                  ...devices.filter((d) => !d.rackCabinId).map((d) => ({ id: d.id, lat: d.lat, lng: d.lng })),
                  ...sockets.filter((s) => !s.workstationId).map((s) => ({ id: s.id, lat: s.lat, lng: s.lng })),
                  ...infrastructure.map((i) => ({ id: i.id, lat: i.lat, lng: i.lng })),
                ]}
              />

              {/* Connection Lines */}
              {(() => {
                const connectionGroups = new Map<
                  string,
                  TopologyConnection[]
                >();
                connections.forEach((conn) => {
                  const pairKey = [conn.sourceDeviceId, conn.targetDeviceId]
                    .sort()
                    .join("-");
                  if (!connectionGroups.has(pairKey)) {
                    connectionGroups.set(pairKey, []);
                  }
                  connectionGroups.get(pairKey)!.push(conn);
                });

                return Array.from(connectionGroups.entries()).map(
                  ([pairKey, groupConnections]) => {
                    const firstConn = groupConnections[0];
                    const sourcePos = findPosition(firstConn.sourceDeviceId);
                    const targetPos = findPosition(firstConn.targetDeviceId);
                    if (!sourcePos || !targetPos) return null;

                    return (
                      <ConnectionGroup
                        key={pairKey}
                        sourcePosition={[sourcePos.lat, sourcePos.lng]}
                        targetPosition={[targetPos.lat, targetPos.lng]}
                        connections={groupConnections}
                        onDeleteConnection={removeConnection}
                        onUpdateConnectionColor={updateConnectionColor}
                        onUpdateConnectionName={updateConnectionName}
                        onAddCable={(type) =>
                          addConnection(
                            firstConn.sourceDeviceId,
                            firstConn.targetDeviceId,
                            type,
                          )
                        }
                        onUpdateConnectionWaypoints={updateConnectionWaypoints}
                      />
                    );
                  },
                );
              })()}

              {/* Device Markers */}
              {devices
                .filter((d) => !d.rackCabinId)
                .map((device) => (
                  <DeviceMarker
                    key={device.id}
                    id={device.id}
                    type={device.type}
                    lat={device.lat}
                    lng={device.lng}
                    rotation={device.rotation}
                    label={device.name}
                    color={device.color}
                    note={device.note}
                    ipAddress={device.ipAddress}
                    flipX={device.flipX}
                    flipY={device.flipY}
                    labelPosition={device.labelPosition}
                    isSelected={device.id === selectedDeviceId}
                    isPendingConnection={device.id === pendingConnectionSource}
                    draggable={!connectionMode && !isLocked}
                    rackCabinId={device.rackCabinId}
                    rackCabinName={
                      device.rackCabinId
                        ? infrastructure.find(
                            (i) => i.id === device.rackCabinId,
                          )?.label
                        : null
                    }
                    onClick={() => handleDeviceClick(device.id)}
                    onDragEnd={(lat, lng) => moveDevice(device.id, lat, lng)}
                    onDelete={() => removeDevice(device.id)}
                    onRotate={(degrees) => rotateDevice(device.id, degrees)}
                    onSetRotation={(degrees) =>
                      setDeviceRotation(device.id, degrees)
                    }
                    onFlipX={() => flipDeviceX(device.id)}
                    onFlipY={() => flipDeviceY(device.id)}
                    onUpdateNote={(note) => updateDeviceNote(device.id, note)}
                    onUpdateLabel={(label) =>
                      updateDeviceLabel(device.id, label)
                    }
                    onUpdateIp={(ip) => updateDeviceIp(device.id, ip)}
                    onUpdateColor={(color) =>
                      updateDeviceColor(device.id, color)
                    }
                    onUpdateLabelPosition={(position) =>
                      updateDeviceLabelPosition(device.id, position)
                    }
                    onUpdateBrand={(brand) => updateDeviceBrand(device.id, brand)}
                    onUpdateModel={(model) => updateDeviceModel(device.id, model)}
                    onUpdateSerialNumber={(sn) => updateDeviceSerialNumber(device.id, sn)}
                    onUpdateSubtype={(st) => updateDeviceSubtype(device.id, st)}
                    brand={device.brand}
                    model={device.model}
                    serialNumber={device.serialNumber}
                    subtype={device.subtype}
                    onDuplicate={() => duplicateDevice(device.id)}
                    onRemoveFromRackCabin={() =>
                      removeDeviceFromRackCabin(device.id)
                    }
                  />
                ))}

              {/* Standalone Socket Markers */}
              {sockets
                .filter((s) => !s.workstationId)
                .map((socket) => (
                  <SocketMarker
                    key={socket.id}
                    id={socket.id}
                    type={socket.type}
                    lat={socket.lat}
                    lng={socket.lng}
                    rotation={socket.rotation}
                    label={socket.name}
                    color={socket.color}
                    note={socket.note}
                    flipX={socket.flipX}
                    flipY={socket.flipY}
                    labelPosition={socket.labelPosition}
                    isSelected={false}
                    isPendingConnection={socket.id === pendingConnectionSource}
                    draggable={!connectionMode && !isLocked}
                    onClick={() => {
                      // Sockets can participate in connection mode
                      if (connectionMode) {
                        if (pendingConnectionSource === null) {
                          setPendingConnectionSource(socket.id);
                          toast.info(i18n.t("editorPage.selectSecondItem"));
                        } else {
                          addConnection(pendingConnectionSource, socket.id);
                          setPendingConnectionSource(null);
                        }
                      }
                    }}
                    onDragEnd={(lat, lng) => moveSocket(socket.id, lat, lng)}
                    onDelete={() => removeSocket(socket.id)}
                    onRotate={(degrees) => rotateSocket(socket.id, degrees)}
                    onFlipX={() => flipSocketX(socket.id)}
                    onFlipY={() => flipSocketY(socket.id)}
                    onUpdateNote={(note) => updateSocketNote(socket.id, note)}
                    onUpdateLabel={(label) => updateSocketLabel(socket.id, label)}
                    onUpdateColor={(color) =>
                      updateSocketColor(socket.id, color)
                    }
                    onUpdateLabelPosition={(position) =>
                      updateSocketLabelPosition(socket.id, position)
                    }
                    onDuplicate={() => duplicateSocket(socket.id)}
                  />
                ))}

              {/* Infrastructure Markers */}
              {infrastructure.map((infra) => {
                if (infra.type === InfrastructureType.RACK_CABIN) {
                  const childDevices = devices
                    .filter((d) => d.rackCabinId === infra.id)
                    .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
                    .map((d) => ({ id: d.id, type: d.type, name: d.name }));

                  return (
                    <RackCabinMarker
                      key={infra.id}
                      id={infra.id}
                      type={infra.type}
                      lat={infra.lat}
                      lng={infra.lng}
                      rotation={infra.rotation}
                      label={infra.label}
                      color={infra.color}
                      note={infra.note}
                      flipX={infra.flipX}
                      flipY={infra.flipY}
                      labelPosition={infra.labelPosition}
                      isSelected={infra.id === selectedInfrastructureId}
                      draggable={!connectionMode && !isLocked}
                      childDevices={childDevices}
                      childDevicesWithId={childDevices}
                      onClick={() => handleInfrastructureClick(infra.id)}
                      onShiftClick={() =>
                        handleInfrastructureShiftClick(infra.id)
                      }
                      onDragEnd={(lat, lng) => moveInfrastructure(infra.id, lat, lng)}
                      onDelete={() => removeInfrastructure(infra.id)}
                      onRotate={(deg) => rotateInfrastructure(infra.id, deg)}
                      onDuplicate={() => duplicateInfrastructure(infra.id)}
                      onRemoveChildDevice={removeDeviceFromRackCabin}
                      onUpdateNote={(note) =>
                        updateInfrastructureNote(infra.id, note)
                      }
                      onUpdateLabel={(label) =>
                        updateInfrastructureLabel(infra.id, label)
                      }
                      onUpdateColor={(color) =>
                        updateInfrastructureColor(infra.id, color)
                      }
                      onUpdateLabelPosition={(position) =>
                        updateInfrastructureLabelPosition(infra.id, position)
                      }
                    />
                  );
                }

                if (infra.type === InfrastructureType.WORKSTATION) {
                  const childSockets = sockets
                    .filter((s) => s.workstationId === infra.id)
                    .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
                    .map((s) => ({ id: s.id, type: s.type, name: s.name }));

                  return (
                    <WorkstationMarker
                      key={infra.id}
                      id={infra.id}
                      type={infra.type}
                      lat={infra.lat}
                      lng={infra.lng}
                      rotation={infra.rotation}
                      label={infra.label}
                      color={infra.color}
                      note={infra.note}
                      flipX={infra.flipX}
                      flipY={infra.flipY}
                      labelPosition={infra.labelPosition}
                      isSelected={infra.id === selectedInfrastructureId}
                      draggable={!connectionMode && !isLocked}
                      childSockets={childSockets}
                      childSocketsWithId={childSockets}
                      onRemoveChildSocket={removeSocketFromWorkstation}
                      onClick={() => handleInfrastructureClick(infra.id)}
                      onShiftClick={() =>
                        handleInfrastructureShiftClick(infra.id)
                      }
                      onDragEnd={(lat, lng) => moveInfrastructure(infra.id, lat, lng)}
                      onDelete={() => removeInfrastructure(infra.id)}
                      onRotate={(deg) => rotateInfrastructure(infra.id, deg)}
                      onDuplicate={() => duplicateInfrastructure(infra.id)}
                      onUpdateNote={(note) =>
                        updateInfrastructureNote(infra.id, note)
                      }
                      onUpdateLabel={(label) =>
                        updateInfrastructureLabel(infra.id, label)
                      }
                      onUpdateColor={(color) =>
                        updateInfrastructureColor(infra.id, color)
                      }
                      onUpdateLabelPosition={(position) =>
                        updateInfrastructureLabelPosition(infra.id, position)
                      }
                    />
                  );
                }

                return null;
              })}
            </MapContainer>
          )}
        </div>
      </div>

      {/* Rack Cabin Detail Drawer */}
      {selectedCabinetId &&
        (() => {
          const cabinet = infrastructure.find(
            (i) => i.id === selectedCabinetId,
          );
          if (!cabinet || cabinet.type !== InfrastructureType.RACK_CABIN)
            return null;
          const childDevicesForCabinet = devices
            .filter((d) => d.rackCabinId === cabinet.id)
            .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));

          return (
            <RackCabinDetailDrawer
              open={drawerOpen}
              onOpenChange={setDrawerOpen}
              cabinetId={cabinet.id}
              cabinetName={cabinet.label}
              cabinetNote={cabinet.note}
              childDevices={childDevicesForCabinet.map((d) => ({
                id: d.id,
                name: d.name,
                type: d.type,
                ipAddress: d.ipAddress,
                note: d.note,
                brand: d.brand,
                model: d.model,
                serialNumber: d.serialNumber,
                subtype: d.subtype,
              }))}
              connections={connections}
              allDevices={[
                ...devices.map((d) => ({
                  id: d.id,
                  name: d.name,
                  type: d.type,
                })),
                ...infrastructure.map((i) => ({
                  id: i.id,
                  name: i.label,
                  type: i.type,
                })),
              ]}
              isEditable
              onRemoveDevice={removeDeviceFromRackCabin}
              onUpdateDeviceIp={updateDeviceIp}
              onUpdateDeviceName={updateDeviceLabel}
              onUpdateDeviceNote={updateDeviceNote}
              onUpdateDeviceBrand={updateDeviceBrand}
              onUpdateDeviceModel={updateDeviceModel}
              onUpdateDeviceSerialNumber={updateDeviceSerialNumber}
              onUpdateCabinetName={(name) =>
                updateInfrastructureLabel(cabinet.id, name)
              }
              onUpdateCabinetNote={(note) =>
                updateInfrastructureNote(cabinet.id, note)
              }
              onUpdateConnectionPort={updateConnectionPort}
              onUpdateConnectionInternalDevice={
                updateConnectionInternalDevice
              }
              onUpdateConnectionName={updateConnectionName}
              onReorderDevices={(orderedIds) =>
                reorderRackCabinDevices(cabinet.id, orderedIds)
              }
            />
          );
        })()}

      {/* Workstation Detail Drawer */}
      {selectedWorkstationId &&
        (() => {
          const workstation = infrastructure.find(
            (i) => i.id === selectedWorkstationId,
          );
          if (
            !workstation ||
            workstation.type !== InfrastructureType.WORKSTATION
          )
            return null;
          const childSocketsForWorkstation = sockets
            .filter((s) => s.workstationId === workstation.id)
            .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));

          return (
            <WorkstationDetailDrawer
              open={workstationDrawerOpen}
              onOpenChange={setWorkstationDrawerOpen}
              workstationName={workstation.label}
              workstationNote={workstation.note}
              childSockets={childSocketsForWorkstation.map((s) => ({
                id: s.id,
                name: s.name,
                type: s.type,
                note: s.note,
              }))}
              isEditable
              onRemoveSocket={removeSocketFromWorkstation}
              onUpdateSocketName={updateSocketLabel}
              onUpdateSocketNote={updateSocketNote}
              onUpdateWorkstationName={(name) =>
                updateInfrastructureLabel(workstation.id, name)
              }
              onUpdateWorkstationNote={(note) =>
                updateInfrastructureNote(workstation.id, note)
              }
              onReorderSockets={(orderedIds) =>
                reorderWorkstationSockets(workstation.id, orderedIds)
              }
            />
          );
        })()}
    </div>

    {/* Unsaved changes navigation blocker */}
    <AlertDialog open={blocker.state === "blocked"}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("editorPage.leaveTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("editorPage.leaveDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => blocker.reset?.()}>
            {t("editorPage.stay")}
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => blocker.proceed?.()}
          >
            {t("editorPage.leaveAnyway")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    </ContextMenuProvider>
  );
}
