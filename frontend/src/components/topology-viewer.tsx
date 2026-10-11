import "leaflet/dist/leaflet.css";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router";
import { MapContainer, ImageOverlay, Marker, Polyline } from "react-leaflet";
import L from "leaflet";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import i18n from "~/lib/i18n";
import { useTypeLabels } from "~/hooks/use-type-labels";
import {
  Users,
  Loader2,
  Calendar,
  Clock,
  Eye,
  Pencil,
  FileDown,
  Menu,
  X,
  Trash2,
  Copy,
  PanelRightOpen,
  UserX,
  ArrowLeft,
  Search,
} from "lucide-react";
import { HighlightMatch } from "./highlight-match";
import {
  createLeafletIcon,
  createInfrastructureLeafletIcon,
  createInfrastructureLeafletIconForWorkstation,
  createSocketLeafletIcon,
  socketLabels,
  DeviceType,
  InfrastructureType,
  SocketType,
  CameraSubtype,
  type LabelPosition,
} from "./icons";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { RackCabinDetailDrawer } from "./rack-cabin-detail-drawer";
import { WorkstationDetailDrawer } from "./workstation-detail-drawer";
import { MapController, ZoomController, SmartPopup, FocusController } from "./map";
import { shortenLine, offsetLine, offsetPolyline } from "~/lib/line-geometry";
import {
  DEFAULT_BOUNDS,
  LINE_TYPES,
  LINE_TYPE_LABELS,
  ICON_MARGIN,
  PARALLEL_OFFSET,
} from "~/constants/topology";
import { usePdfExport } from "~/hooks/use-pdf-export";
import { PdfExportDialog } from "./pdf-export-dialog";
import deleteTopology from "~/functions/delete_topology";
import duplicateTopology from "~/functions/duplicate_topology";
import unassignTopology from "~/functions/unassign_topology";
import getClients from "~/functions/get_clients";
import getAllTopologies from "~/functions/get_all_topologies";
import getTopologyById from "~/functions/get_topology_by_id";
import getTopologiesByClient, {
  type Topology,
  type DeviceData,
  type RackCabinData,
  type WorkstationData,
  type ConnectionData,
  type SocketData,
} from "~/functions/get_topologies_by_client";
import type { User, LineType, CurrentUserType } from "~/types";
import { CustomPermission } from "~/types";
import type {
  ViewerDevice,
  ViewerSocket,
  ViewerInfrastructure,
  ViewerConnection,
} from "~/types/topology";

interface TopologyViewerProps {
  currentUser?: CurrentUserType | null;
  initialTopologyId?: string;
}

export default function TopologyViewer({ currentUser, initialTopologyId }: TopologyViewerProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { deviceLabels: tDeviceLabels, infrastructureLabels: tInfraLabels, cameraSubtypeLabels: tCameraSubtypeLabels } = useTypeLabels();

  const [clients, setClients] = useState<User[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [clientUsername, setClientUsername] = useState("");

  const [topologies, setTopologies] = useState<Topology[]>([]);
  const [isLoadingTopologies, setIsLoadingTopologies] = useState(false);
  const [selectedTopologyId, setSelectedTopologyId] = useState<string | null>(
    null,
  );

  const [devices, setDevices] = useState<ViewerDevice[]>([]);
  const [sockets, setSockets] = useState<ViewerSocket[]>([]);
  const [infrastructure, setInfrastructure] = useState<ViewerInfrastructure[]>(
    [],
  );
  const [connections, setConnections] = useState<ViewerConnection[]>([]);
  const [blueprintUrl, setBlueprintUrl] = useState<string | null>(null);
  // Blueprint URL used for map display, set once the image has loaded and bounds are known
  const [displayBlueprintUrl, setDisplayBlueprintUrl] = useState<string | null>(null);
  const [imageBounds, setImageBounds] =
    useState<L.LatLngBoundsExpression>(DEFAULT_BOUNDS);
  const [boundsReady, setBoundsReady] = useState(false);

  // Popup state
  const [openPopupId, setOpenPopupId] = useState<string | null>(null);

  // Map focus target — set when a component is picked from the sidebar
  const [focusTarget, setFocusTarget] = useState<{
    lat: number;
    lng: number;
    nonce: number;
  } | null>(null);
  const focusNonce = useRef(0);

  // Sidebar search query — filters the component lists client-side only
  const [searchQuery, setSearchQuery] = useState("");

  // Mobile sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Rack cabin detail drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCabinetId, setSelectedCabinetId] = useState<string | null>(
    null,
  );

  // Workstation detail drawer state
  const [workstationDrawerOpen, setWorkstationDrawerOpen] = useState(false);
  const [selectedWorkstationId, setSelectedWorkstationId] = useState<
    string | null
  >(null);

const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isUnassigning, setIsUnassigning] = useState(false);
  const [isUnassignDialogOpen, setIsUnassignDialogOpen] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [zoom, setZoom] = useState(1);

  const selectedTopology =
    topologies.find((t) => t.id === selectedTopologyId) || null;

  // PDF Export hook
  const { isExporting, handleExportPdf } = usePdfExport({
    selectedTopology,
    clientUsername,
    devices,
    infrastructure,
    sockets,
    connections,
    blueprintUrl,
    imageBounds,
  });

  const isTech = currentUser?.role === "ROLE_TECH";
  // MODERATOR also has no access to /api/admin/users (getClients), so treat like TECH
  const isModerator = currentUser?.role === "ROLE_MODERATOR";
  // CUSTOM users without any broader permissions behave like a client (own assigned topologies only)
  const isCustomClient =
    currentUser?.role === "ROLE_CUSTOM" &&
    !currentUser.customPermissions?.some((p) =>
      [
        CustomPermission.VIEW_ALL_TOPOLOGIES,
        CustomPermission.VIEW_OWN_UNASSIGNED,
        CustomPermission.CREATE_TOPOLOGY,
        CustomPermission.ACCESS_ADMIN_PANEL,
      ].includes(p)
    );
  const isEffectiveClient = currentUser?.isClient || isCustomClient;
  const isSuperior = ["ROLE_ADMIN", "ROLE_DEVELOPER", "ROLE_MANAGER"].includes(currentUser?.role ?? "");
  const usesDirectTopologyLoad = isTech || isModerator;

  // Load a single topology directly by ID (read-only mode from my-topologies)
  useEffect(() => {
    if (!initialTopologyId) return;
    const load = async () => {
      setIsLoadingTopologies(true);
      try {
        const data = await getTopologyById(initialTopologyId);
        setTopologies([data]);
        setSelectedTopologyId(data.id);
      } catch {
        toast.error(i18n.t("viewer.loadTopologyFailed"));
      } finally {
        setIsLoadingTopologies(false);
      }
    };
    load();
  }, [initialTopologyId]);

  // Fetch clients on mount (only for non-client, non-tech, non-moderator users)
  useEffect(() => {
    if (initialTopologyId) return;
    if (isEffectiveClient && currentUser?.username) {
      setClientUsername(currentUser.username);
      setIsLoadingClients(false);
      return;
    }

    // TECH and MODERATOR: load client-assigned topologies directly (no client selector)
    // Drafts (unassigned) are managed on the Unassigned Topologies page, not the viewer
    if (usesDirectTopologyLoad) {
      const fetchAllTopologies = async () => {
        setIsLoadingTopologies(true);
        try {
          const data = await getAllTopologies();
          const assignedOnly = data.filter((t) => t.clientUsernames?.length);
          setTopologies(assignedOnly);
          if (assignedOnly.length > 0) {
            setSelectedTopologyId(assignedOnly[0].id);
          }
        } catch {
          toast.error(i18n.t("viewer.loadTopologiesFailed"));
        } finally {
          setIsLoadingTopologies(false);
        }
      };
      fetchAllTopologies();
      return;
    }

    if (!isEffectiveClient) {
      const fetchClients = async () => {
        try {
          setIsLoadingClients(true);
          const data = await getClients();
          setClients(data);
          // Auto-select first client so the viewer loads immediately
          if (data.length > 0) {
            setClientUsername(data[0].username);
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          if (
            !errorMessage.includes("403") &&
            !errorMessage.includes("Forbidden")
          ) {
            toast.error(i18n.t("viewer.loadClientsFailed"));
          }
        } finally {
          setIsLoadingClients(false);
        }
      };
      fetchClients();
    }
  }, [currentUser, usesDirectTopologyLoad]);

  // Fetch topologies when client changes (not used for TECH/MODERATOR or initialTopologyId)
  useEffect(() => {
    if (initialTopologyId) return;
    if (usesDirectTopologyLoad) return;

    if (!clientUsername) {
      setTopologies([]);
      setSelectedTopologyId(null);
      return;
    }

    const fetchTopologies = async () => {
      setIsLoadingTopologies(true);
      try {
        const data = await getTopologiesByClient(clientUsername);
        setTopologies(data);
        if (data.length > 0) {
          setSelectedTopologyId(data[0].id);
        } else {
          setSelectedTopologyId(null);
        }
      } catch {
        toast.error(i18n.t("viewer.loadTopologiesFailed"));
        setTopologies([]);
      } finally {
        setIsLoadingTopologies(false);
      }
    };
    fetchTopologies();
  }, [clientUsername, usesDirectTopologyLoad]);

  // Load selected topology
  useEffect(() => {
    const topology = topologies.find((t) => t.id === selectedTopologyId);
    if (!topology) {
      setDevices([]);
      setSockets([]);
      setInfrastructure([]);
      setConnections([]);
      setBlueprintUrl(null);
      return;
    }

    setBlueprintUrl(topology.blueprintPictureUrl);

    // Build a deviceId -> rackCabinId map from cabin.devices (source of truth).
    // Also collect all deviceIds that correctly belong to a rack cabin.
    const deviceRackCabinMap = new Map<string, string>();
    const cabinDeviceIds = new Set<string>();
    const cabinDeviceKeys = new Set<string>(); // "label:deviceType" keys for orphan detection
    (topology.rackCabins || []).forEach((cabin: RackCabinData) => {
      (cabin.devices || []).forEach((dev: DeviceData) => {
        deviceRackCabinMap.set(dev.deviceId, cabin.rackCabinId);
        cabinDeviceIds.add(dev.deviceId);
        cabinDeviceKeys.add(`${dev.label}:${dev.deviceType}`);
      });
    });

    // Convert devices. Filter out orphaned entries (corrupted by a previous lazy-loading
    // bug): devices with rackCabinId=null, not in cabin.devices, but whose label+type
    // matches a cabin device — they are duplicate corrupted records.
    const viewerDevices: ViewerDevice[] = (topology.devices || [])
      .filter((dev: DeviceData) => {
        if (dev.rackCabinId || cabinDeviceIds.has(dev.deviceId)) return true;
        // Orphan: same label+type as a cabin device but saved without rackCabinId
        if (cabinDeviceKeys.has(`${dev.label}:${dev.deviceType}`)) return false;
        return true;
      })
      .map((dev: DeviceData) => ({
        id: dev.id,
        deviceId: dev.deviceId,
        type: dev.deviceType as DeviceType,
        label: dev.label,
        lat: dev.positionY,
        lng: dev.positionX,
        rotation: dev.rotation,
        color: dev.color,
        note: dev.note,
        flipX: dev.flipX,
        flipY: dev.flipY,
        ipAddress: dev.ipAddress,
        rackCabinId: dev.rackCabinId || deviceRackCabinMap.get(dev.deviceId) || null,
        orderIndex: dev.orderIndex ?? null,
        labelPosition: (dev.labelPosition as LabelPosition) || null,
        brand: dev.brand || null,
        model: dev.model || null,
        serialNumber: dev.serialNumber || null,
        subtype: dev.subtype || null,
      }));

    // Extract sockets from workstations
    const workstationSockets: ViewerSocket[] = (topology.workstations || []).flatMap(
      (ws: WorkstationData) =>
        (ws.sockets || []).map((soc: SocketData) => ({
          id: soc.id,
          socketId: soc.socketId,
          type: soc.socketType as SocketType,
          label: soc.label,
          color: soc.color,
          note: soc.note,
          workstationId: ws.workstationId,
          orderIndex: soc.orderIndex ?? null,
          labelPosition: (soc.labelPosition as LabelPosition) || null,
        })),
    );

    // Load standalone sockets
    const standaloneSockets: ViewerSocket[] = (topology.sockets || []).map(
      (soc: SocketData) => ({
        id: soc.id,
        socketId: soc.socketId,
        type: soc.socketType as SocketType,
        label: soc.label,
        lat: soc.positionY ?? null,
        lng: soc.positionX ?? null,
        color: soc.color,
        note: soc.note,
        workstationId: null,
        orderIndex: soc.orderIndex ?? null,
        labelPosition: (soc.labelPosition as LabelPosition) || null,
      }),
    );

    const viewerSockets: ViewerSocket[] = [...workstationSockets, ...standaloneSockets];

    // Convert infrastructure
    const viewerInfrastructure: ViewerInfrastructure[] = [];

    (topology.rackCabins || []).forEach((cabin: RackCabinData) => {
      viewerInfrastructure.push({
        id: cabin.id,
        infraId: cabin.rackCabinId,
        type: InfrastructureType.RACK_CABIN,
        label: cabin.label,
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

    (topology.workstations || []).forEach((ws: WorkstationData) => {
      viewerInfrastructure.push({
        id: ws.id,
        infraId: ws.workstationId,
        type: InfrastructureType.WORKSTATION,
        label: ws.label,
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

    setDevices(viewerDevices);
    setInfrastructure(viewerInfrastructure);
    setSockets(viewerSockets);

    // Convert connections
    const viewerConnections: ViewerConnection[] = (
      topology.connections || []
    ).map((conn: ConnectionData) => ({
      id: conn.id,
      sourceDeviceId: conn.sourceDeviceId,
      targetDeviceId: conn.targetDeviceId,
      color: conn.color,
      lineType: conn.lineType as LineType | undefined,
      sourcePort: conn.sourcePort ?? null,
      targetPort: conn.targetPort ?? null,
      sourceInternalDeviceId: conn.sourceInternalDeviceId ?? null,
      targetInternalDeviceId: conn.targetInternalDeviceId ?? null,
      name: conn.name ?? null,
      waypoints: conn.waypoints ? JSON.parse(conn.waypoints) : null,
    }));
    setConnections(viewerConnections);
  }, [selectedTopologyId, topologies]);

  // Load the blueprint at full resolution and derive imageBounds from its aspect ratio.
  // The image is displayed as-is with no canvas re-encode, so the viewer shows exactly the
  // pixels that were uploaded.
  useEffect(() => {
    if (!blueprintUrl) {
      setBoundsReady(false);
      setDisplayBlueprintUrl(null);
      return;
    }
    setBoundsReady(false);
    let cancelled = false;

    const processImage = (img: HTMLImageElement) => {
      if (cancelled) return;

      const srcW = img.naturalWidth || img.width;
      const srcH = img.naturalHeight || img.height;
      const aspectRatio = srcW / srcH;
      const mapHeight = 800;

      setImageBounds([[0, 0], [mapHeight, mapHeight * aspectRatio]]);
      setDisplayBlueprintUrl(blueprintUrl);
      setBoundsReady(true);
    };

    const img = new Image();
    img.onload = () => processImage(img);
    img.onerror = () => {
      if (cancelled) return;
      // Keep the previous bounds rather than blocking render on a failed probe
      setDisplayBlueprintUrl(blueprintUrl);
      setBoundsReady(true);
    };
    img.src = blueprintUrl;

    return () => {
      cancelled = true;
      img.onload = null;
      img.onerror = null;
    };
  }, [blueprintUrl]);

  // Helper to find position from devices, infrastructure, or standalone sockets
  const findPosition = useCallback(
    (id: string): { id: string; lat: number; lng: number } | null => {
      const device = devices.find((d) => d.deviceId === id || d.id === id);
      if (device) return { id: device.id, lat: device.lat, lng: device.lng };
      const infra = infrastructure.find((i) => i.infraId === id || i.id === id);
      if (infra) return { id: infra.id, lat: infra.lat, lng: infra.lng };
      // Check standalone sockets
      const socket = sockets.find((s) => (s.socketId === id || s.id === id) && !s.workstationId && s.lat != null && s.lng != null);
      if (socket) return { id: socket.id, lat: socket.lat!, lng: socket.lng! };
      return null;
    },
    [devices, infrastructure, sockets],
  );

  // Sidebar lists: sorted naturally, then filtered by the search query.
  // Matching is client-side over label, IP address, type, and note text.
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const byLabelNatural = useCallback(
    (a: { label: string }, b: { label: string }) =>
      a.label.localeCompare(b.label, undefined, { numeric: true }),
    [],
  );

  const filteredDevices = useMemo(() => {
    const sorted = [...devices].sort(byLabelNatural);
    if (!normalizedQuery) return sorted;
    return sorted.filter((d) =>
      [
        d.label,
        d.ipAddress,
        d.note,
        d.brand,
        d.model,
        d.serialNumber,
        tDeviceLabels[d.type] || d.type,
      ]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(normalizedQuery)),
    );
  }, [devices, normalizedQuery, byLabelNatural, tDeviceLabels]);

  const filteredInfrastructure = useMemo(() => {
    const sorted = [...infrastructure].sort(byLabelNatural);
    if (!normalizedQuery) return sorted;
    return sorted.filter((i) =>
      [i.label, i.note, tInfraLabels[i.type] || i.type]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(normalizedQuery)),
    );
  }, [infrastructure, normalizedQuery, byLabelNatural, tInfraLabels]);

  /**
   * Selects a component picked from the sidebar: pans the map to it and opens
   * its popup. Devices in a rack cabin and sockets on a workstation have no
   * marker of their own, so they resolve to their parent, whose popup is
   * opened instead.
   */
  const handleSelectComponent = useCallback(
    (target: { lat: number; lng: number; popupId: string }) => {
      focusNonce.current += 1;
      setFocusTarget({
        lat: target.lat,
        lng: target.lng,
        nonce: focusNonce.current,
      });
      setOpenPopupId(target.popupId);
      // On mobile the sidebar covers the map, so close it to reveal the marker
      setIsSidebarOpen(false);
    },
    [],
  );

  /** Resolves the map marker that represents a sidebar device. */
  const resolveDeviceTarget = useCallback(
    (device: ViewerDevice) => {
      if (!device.rackCabinId) {
        return { lat: device.lat, lng: device.lng, popupId: device.id };
      }
      const parent = infrastructure.find(
        (i) => i.infraId === device.rackCabinId || i.id === device.rackCabinId,
      );
      if (!parent) return null;
      return { lat: parent.lat, lng: parent.lng, popupId: parent.id };
    },
    [infrastructure],
  );

  // Helper to find a device/infra/socket label by id
  const findLabel = useCallback(
    (id: string): string => {
      const device = devices.find((d) => d.deviceId === id || d.id === id);
      if (device) return device.label;
      const infra = infrastructure.find((i) => i.infraId === id || i.id === id);
      if (infra) return infra.label;
      const socket = sockets.find((s) => s.socketId === id || s.id === id);
      if (socket) return socket.label;
      return "Unknown";
    },
    [devices, infrastructure, sockets],
  );

  const editorBasePath = "/topology-editor";

  const handleDuplicateTopology = async () => {
    if (!selectedTopologyId) return;
    setIsDuplicating(true);
    try {
      const duplicated = await duplicateTopology(selectedTopologyId);
      toast.success(i18n.t("viewer.duplicateSuccess"));
      const path = clientUsername
        ? `${editorBasePath}/${duplicated.id}?client=${clientUsername}`
        : `${editorBasePath}/${duplicated.id}`;
      navigate(path);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      toast.error(i18n.t("viewer.duplicateFailed", { error: errorMessage }));
      setIsDuplicating(false);
    }
  };

  const handleDeleteTopology = async () => {
    if (!selectedTopologyId) return;
    setIsDeleting(true);
    try {
      await deleteTopology(selectedTopologyId);
      toast.success(i18n.t("viewer.deleteSuccess"));
      const remaining = topologies.filter((t) => t.id !== selectedTopologyId);
      setTopologies(remaining);
      setSelectedTopologyId(remaining.length > 0 ? remaining[0].id : null);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      toast.error(i18n.t("viewer.deleteFailed", { error: errorMessage }));
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleUnassignTopology = async () => {
    if (!selectedTopologyId) return;
    setIsUnassigning(true);
    try {
      await unassignTopology(selectedTopologyId);
      toast.success(i18n.t("viewer.unassignSuccess"));
      const remaining = topologies.filter((t) => t.id !== selectedTopologyId);
      setTopologies(remaining);
      setSelectedTopologyId(remaining.length > 0 ? remaining[0].id : null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error(i18n.t("viewer.unassignFailed", { error: errorMessage }));
    } finally {
      setIsUnassigning(false);
      setIsUnassignDialogOpen(false);
    }
  };

  // Memoize all Leaflet icons so renderToStaticMarkup only runs when device/infra data changes,
  // not on every re-render caused by popup state changes.
  const deviceIcons = useMemo(() =>
    new Map(
      devices
        .filter((d) => !d.rackCabinId)
        .map((device) => [
          device.id,
          createLeafletIcon(
            device.type,
            device.color,
            false,
            device.rotation,
            device.flipX,
            device.flipY,
            device.label,
            device.ipAddress,
            device.labelPosition || undefined,
            device.subtype,
          ),
        ])
    ),
    [devices]
  );

  const socketIconMap = useMemo(() =>
    new Map(
      sockets
        .filter((s) => !s.workstationId && s.lat != null && s.lng != null)
        .map((socket) => [
          socket.id,
          createSocketLeafletIcon(
            socket.type,
            socket.color,
            false,
            0,
            false,
            false,
            socket.label,
            socket.labelPosition || undefined,
          ),
        ])
    ),
    [sockets]
  );

  const infraIconMap = useMemo(() =>
    new Map(
      infrastructure.map((infra) => [
        infra.id,
        infra.type === InfrastructureType.WORKSTATION
          ? createInfrastructureLeafletIconForWorkstation(
              infra.type,
              infra.color,
              false,
              infra.rotation,
              infra.flipX,
              infra.flipY,
              infra.label,
              sockets
                .filter((s) => s.workstationId === infra.infraId)
                .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
                .map((s) => ({ type: s.type, name: s.label })),
              infra.labelPosition || undefined,
            )
          : createInfrastructureLeafletIcon(
              infra.type,
              infra.color,
              false,
              infra.rotation,
              infra.flipX,
              infra.flipY,
              infra.label,
              devices
                .filter((d) => d.rackCabinId === infra.infraId)
                .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
                .map((d) => ({ type: d.type, name: d.label })),
              infra.labelPosition || undefined,
            ),
      ])
    ),
    [infrastructure, devices, sockets]
  );

  // Pre-compute parallel connection groups so the render loop doesn't do O(n²) filtering.
  // Key is "smallerId:largerId" to treat A→B and B→A as the same edge.
  const parallelGroups = useMemo(() => {
    const posMap = new Map(
      [...devices.map((d) => [d.deviceId, d.id] as [string, string]),
       ...devices.map((d) => [d.id, d.id] as [string, string]),
       ...infrastructure.map((i) => [i.infraId, i.id] as [string, string]),
       ...infrastructure.map((i) => [i.id, i.id] as [string, string]),
       ...sockets.filter((s) => !s.workstationId && s.lat != null).map((s) => [s.socketId, s.id] as [string, string]),
       ...sockets.filter((s) => !s.workstationId && s.lat != null).map((s) => [s.id, s.id] as [string, string]),
      ]
    );
    const groups = new Map<string, string[]>(); // edgeKey → [connId, ...]
    for (const conn of connections) {
      const aId = posMap.get(conn.sourceDeviceId);
      const bId = posMap.get(conn.targetDeviceId);
      if (!aId || !bId) continue;
      const key = aId < bId ? `${aId}:${bId}` : `${bId}:${aId}`;
      const arr = groups.get(key);
      if (arr) arr.push(conn.id);
      else groups.set(key, [conn.id]);
    }
    return groups;
  }, [connections, devices, infrastructure, sockets]);

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-background">
      {/* Duplicating Overlay */}
      {isDuplicating && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-background/60">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">{t("viewer.duplicating")}</p>
          </div>
        </div>
      )}

      {/* Header Toolbar */}
      <div className="bg-card border-b border-border p-3 flex flex-wrap items-center gap-4 overflow-x-auto">
        {initialTopologyId && (
          <>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("viewer.back")}
            </button>
            <div className="w-px h-6 bg-border shrink-0" />
          </>
        )}
        <div className="flex items-center gap-2 shrink-0">
          <Eye className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-foreground font-medium">
            {initialTopologyId ? (selectedTopology?.name || t("viewer.topologyView")) : isEffectiveClient ? t("viewer.myTopologies") : t("viewer.topologyViewer")}
          </h1>
        </div>

        {/* Client Selector — hidden for TECH, client users, and single-topology mode */}
        {!initialTopologyId && !isEffectiveClient && !usesDirectTopologyLoad && (
          <>
            <div className="w-px h-6 bg-border shrink-0" />
            <div className="flex items-center gap-2 shrink-0">
              <Users className="h-4 w-4 text-muted-foreground" />
              <select
                value={clientUsername}
                onChange={(e) => setClientUsername(e.target.value)}
                disabled={isLoadingClients}
                className="bg-secondary text-foreground text-sm rounded px-2 py-1.5 border border-border focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">
                  {isLoadingClients ? t("viewer.loading") : t("viewer.selectClient")}
                </option>
                {clients.map((client) => (
                  <option key={client.id} value={client.username}>
                    {client.username}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        {/* Topology Selector — hidden in single-topology mode */}
        {!initialTopologyId && (usesDirectTopologyLoad || isEffectiveClient || clientUsername) && (
          <>
            <div className="w-px h-6 bg-border shrink-0" />
            <div className="flex items-center gap-2 shrink-0">
              {isLoadingTopologies ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <select
                  value={selectedTopologyId || ""}
                  onChange={(e) => setSelectedTopologyId(e.target.value)}
                  disabled={topologies.length === 0}
                  className="bg-secondary text-foreground text-sm rounded px-2 py-1.5 border border-border focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {topologies.length === 0 ? (
                    <option value="">{t("viewer.noTopologiesFound")}</option>
                  ) : (
                    [...topologies].sort((a, b) => a.name.localeCompare(b.name)).map((topology) => (
                      <option key={topology.id} value={topology.id}>
                        {topology.name}
                      </option>
                    ))
                  )}
                </select>
              )}
            </div>
          </>
        )}


        {/* Topology Info */}
        {selectedTopology && (
          <>
            <div className="w-px h-6 bg-border shrink-0" />
            <div className="flex items-center gap-2 text-muted-foreground text-sm shrink-0">
              {selectedTopology.updatedAt ? (
                <>
                  <Clock className="h-4 w-4" />
                  <span title={t("viewer.createdTooltip", { date: new Date(selectedTopology.createdAt).toLocaleDateString() })}>
                    {t("viewer.updatedDate", { date: new Date(selectedTopology.updatedAt).toLocaleDateString() })}
                  </span>
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4" />
                  <span>
                    {new Date(selectedTopology.createdAt).toLocaleDateString()}
                  </span>
                </>
              )}
              <span className="opacity-50">•</span>
              <span>{t("viewer.devicesCount", { count: devices.length })}</span>
              {connections.length > 0 && (
                <>
                  <span className="opacity-50">•</span>
                  <span>{t("viewer.connectionsCount", { count: connections.length })}</span>
                </>
              )}
            </div>
            <div className="w-px h-6 bg-border shrink-0" />
            {!initialTopologyId && !isEffectiveClient && (
              <>
                {!((isTech || isModerator) && selectedTopology.clientUsernames?.length) && (
                  <button
                    onClick={() => {
                      const path = clientUsername
                        ? `${editorBasePath}/${selectedTopology.id}?client=${clientUsername}`
                        : `${editorBasePath}/${selectedTopology.id}`;
                      navigate(path);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground text-sm rounded hover:bg-primary/80 transition-colors shrink-0"
                  >
                    <Pencil className="h-4 w-4" />
                    {t("viewer.edit")}
                  </button>
                )}
                {!((isTech || isModerator) && selectedTopology.clientUsernames?.length) && (
                  <button
                    onClick={handleDuplicateTopology}
                    className="flex items-center gap-1 px-3 py-1.5 bg-secondary text-foreground text-sm rounded hover:bg-accent transition-colors shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                    {t("viewer.duplicate")}
                  </button>
                )}
                {isSuperior && selectedTopology.clientUsernames?.length && (
                  <button
                    onClick={() => setIsUnassignDialogOpen(true)}
                    disabled={isUnassigning}
                    className="flex items-center gap-1 px-3 py-1.5 bg-secondary text-foreground text-sm rounded hover:bg-accent transition-colors shrink-0 disabled:opacity-50"
                  >
                    {isUnassigning ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserX className="h-4 w-4" />
                    )}
                    {t("viewer.unassign")}
                  </button>
                )}
                {!((isTech || isModerator) && selectedTopology.clientUsernames?.length) && (
                  <button
                    onClick={() => setIsDeleteDialogOpen(true)}
                    disabled={isDeleting}
                    className="flex items-center gap-1 px-3 py-1.5 bg-destructive text-destructive-foreground text-sm rounded hover:bg-destructive/80 transition-colors shrink-0 disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    {t("viewer.delete")}
                  </button>
                )}
              </>
            )}
            {initialTopologyId && selectedTopology && !isEffectiveClient && !((isTech || isModerator) && selectedTopology.clientUsernames?.length) && (
              <button
                onClick={() => navigate(`${editorBasePath}/${selectedTopology.id}`)}
                className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground text-sm rounded hover:bg-primary/80 transition-colors shrink-0"
              >
                <Pencil className="h-4 w-4" />
                {t("viewer.edit")}
              </button>
            )}
            <button
              onClick={() => setIsExportDialogOpen(true)}
              disabled={isExporting}
              className="flex items-center gap-1 px-3 py-1.5 bg-secondary text-foreground text-sm rounded hover:bg-accent transition-colors shrink-0 disabled:opacity-50"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4" />
              )}
              {t("viewer.exportPdf")}
            </button>
            <PdfExportDialog
              open={isExportDialogOpen}
              onOpenChange={setIsExportDialogOpen}
              onExport={(options) => {
                setIsExportDialogOpen(false);
                handleExportPdf(options);
              }}
              isExporting={isExporting}
              blueprintUrl={blueprintUrl}
              imageBounds={imageBounds}
              devices={devices}
            />
          </>
        )}

      </div>

      <div className="flex flex-1 overflow-hidden min-w-0">
        {/* Mobile Sidebar Toggle */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          onTouchEnd={(e) => {
            e.preventDefault();
            setIsSidebarOpen(!isSidebarOpen);
          }}
          className="md:hidden fixed bottom-6 left-4 z-1100 p-4 min-w-12 min-h-12 bg-primary text-primary-foreground rounded-full shadow-lg active:scale-95 transition-transform touch-manipulation"
          title={isSidebarOpen ? t("viewer.closeSidebar") : t("viewer.openSidebar")}
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

        {/* Device List Sidebar */}
        <div
          className={`
            w-64 shrink-0 bg-background p-4 border-r border-border overflow-y-auto custom-scrollbar
            fixed md:relative inset-y-0 left-0 z-1000 md:z-auto
            transform transition-transform duration-200 ease-in-out
            ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          `}
        >
          {isLoadingTopologies ? (
            /* Skeleton loading state for sidebar */
            <div className="space-y-2 animate-pulse">
              <div className="h-4 w-24 bg-muted rounded mb-4" />
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-2 rounded border border-border space-y-1.5">
                  <div className="h-3.5 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Component search — filters the lists below, frontend only */}
              {(devices.length > 0 || infrastructure.length > 0) && (
                <div className="relative mb-3">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t("viewer.searchPlaceholder")}
                    className="w-full pl-7 pr-7 py-1.5 text-sm bg-card border border-border rounded text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      title={t("viewer.clearSearch")}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground rounded"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )}

              <h2 className="text-foreground font-medium mb-3">
                {normalizedQuery
                  ? t("viewer.devicesHeaderFiltered", {
                      count: filteredDevices.length,
                      total: devices.length,
                    })
                  : t("viewer.devicesHeader", { count: devices.length })}
              </h2>

              {devices.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  {!clientUsername
                    ? t("viewer.selectClientToView")
                    : !selectedTopologyId
                      ? t("viewer.selectTopologyToView")
                      : t("viewer.noDevices")}
                </p>
              ) : filteredDevices.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  {t("viewer.noSearchResults")}
                </p>
              ) : (
                <div className="space-y-2">
                  {filteredDevices.map((device) => (
                    <button
                      key={device.id}
                      type="button"
                      onClick={() => {
                        const target = resolveDeviceTarget(device);
                        if (target) handleSelectComponent(target);
                      }}
                      className={`w-full text-left p-2 bg-card rounded border transition-colors hover:border-primary/60 hover:bg-accent/50 cursor-pointer ${
                        openPopupId === device.id
                          ? "border-primary ring-1 ring-primary"
                          : "border-border"
                      }`}
                    >
                      <p className="text-foreground text-sm font-medium truncate">
                        <HighlightMatch text={device.label} query={searchQuery} />
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {tDeviceLabels[device.type] || device.type}
                      </p>
                      {device.ipAddress && (
                        <p className="text-muted-foreground/70 text-xs font-mono mt-0.5">
                          <HighlightMatch
                            text={device.ipAddress}
                            query={searchQuery}
                          />
                        </p>
                      )}
                      {device.note && (
                        <p className="text-muted-foreground/70 text-xs mt-1 italic truncate">
                          <HighlightMatch text={device.note} query={searchQuery} />
                        </p>
                      )}
                      {device.rackCabinId && (
                        <p className="text-muted-foreground/60 text-xs mt-1 truncate">
                          {t("viewer.insideRackCabin", {
                            name:
                              infrastructure.find(
                                (i) =>
                                  i.infraId === device.rackCabinId ||
                                  i.id === device.rackCabinId,
                              )?.label ?? "—",
                          })}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Infrastructure Section */}
              {infrastructure.length > 0 && filteredInfrastructure.length > 0 && (
                <>
                  <h2 className="text-foreground font-medium mb-3 mt-4">
                    {normalizedQuery
                      ? t("viewer.infrastructureHeaderFiltered", {
                          count: filteredInfrastructure.length,
                          total: infrastructure.length,
                        })
                      : t("viewer.infrastructureHeader", { count: infrastructure.length })}
                  </h2>
                  <div className="space-y-2">
                    {filteredInfrastructure.map((infra) => (
                      <button
                        key={infra.id}
                        type="button"
                        onClick={() =>
                          handleSelectComponent({
                            lat: infra.lat,
                            lng: infra.lng,
                            popupId: infra.id,
                          })
                        }
                        className={`w-full text-left p-2 bg-card rounded border transition-colors hover:border-primary/60 hover:bg-accent/50 cursor-pointer ${
                          openPopupId === infra.id
                            ? "border-primary ring-1 ring-primary"
                            : "border-border"
                        }`}
                      >
                        <p className="text-foreground text-sm font-medium truncate">
                          <HighlightMatch text={infra.label} query={searchQuery} />
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {tInfraLabels[infra.type] || infra.type}
                        </p>
                        {infra.note && (
                          <p className="text-muted-foreground/70 text-xs mt-1 italic truncate">
                            <HighlightMatch text={infra.note} query={searchQuery} />
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Map Container */}
        <div className="flex-1 min-w-0 relative bg-card">
          {/* Zoom indicator */}
          {blueprintUrl && boundsReady && (
            <div className="absolute top-2 right-2 z-1000 flex items-center gap-1">
              <div className="bg-background/80 border border-border rounded px-2 py-1 text-xs text-muted-foreground font-mono pointer-events-none">
                {Math.round(zoom * 100)}%
              </div>
              <button
                onClick={() => setZoom(1)}
                className="bg-background/80 border border-border rounded px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
                title={t("viewer.zoomToPdf")}
              >
                PDF
              </button>
            </div>
          )}
          {isLoadingTopologies ? (
            /* Skeleton loading state for map area */
            <div className="absolute inset-0 animate-pulse">
              <div className="absolute inset-4 bg-muted rounded-lg" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">{t("viewer.loadingTopology")}</p>
                </div>
              </div>
            </div>
          ) : !blueprintUrl ? (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Eye className="h-10 w-10 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">{t("viewer.noTopologySelected")}</p>
                <p className="text-sm">
                  {t("viewer.selectToView")}
                </p>
              </div>
            </div>
          ) : !boundsReady ? (
            /* Blueprint URL set but image still loading — show skeleton map */
            <div className="absolute inset-0 animate-pulse">
              <div className="absolute inset-4 bg-muted rounded-lg" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">Loading map…</p>
                </div>
              </div>
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
              <FocusController target={focusTarget} />
              <ImageOverlay url={displayBlueprintUrl!} bounds={imageBounds} />

              {/* Connection Lines */}
              {connections.map((conn) => {
                const sourcePos = findPosition(conn.sourceDeviceId);
                const targetPos = findPosition(conn.targetDeviceId);
                if (!sourcePos || !targetPos) return null;

                const edgeKey = sourcePos.id < targetPos.id
                  ? `${sourcePos.id}:${targetPos.id}`
                  : `${targetPos.id}:${sourcePos.id}`;
                const parallelIds = parallelGroups.get(edgeKey) ?? [conn.id];
                const parallelIndex = parallelIds.indexOf(conn.id);
                const totalParallel = parallelIds.length;
                const offsetIndex = parallelIndex - (totalParallel - 1) / 2;
                const offsetAmount = offsetIndex * PARALLEL_OFFSET;

                const waypoints = conn.waypoints || [];
                const srcPos: [number, number] = [sourcePos.lat, sourcePos.lng];
                const tgtPos: [number, number] = [targetPos.lat, targetPos.lng];

                // Build full multi-point path first
                let fullPath: [number, number][] = [
                  srcPos,
                  ...waypoints,
                  tgtPos,
                ];

                // Apply offset for parallel lines BEFORE shortening
                if (totalParallel > 1) {
                  fullPath = offsetPolyline(fullPath, offsetAmount);
                }

                // Shorten from source to first point, and from last point to target
                // This must be done AFTER offsetting to ensure proper margins
                const [shortenedSource] = shortenLine(
                  fullPath[0],
                  fullPath[1],
                  ICON_MARGIN
                );
                const [, shortenedTarget] = shortenLine(
                  fullPath[fullPath.length - 2],
                  fullPath[fullPath.length - 1],
                  ICON_MARGIN
                );

                // Replace first and last points with shortened versions
                fullPath[0] = shortenedSource as [number, number];
                fullPath[fullPath.length - 1] = shortenedTarget as [number, number];

                const typeConfig = conn.lineType
                  ? LINE_TYPES[conn.lineType]
                  : LINE_TYPES.data;
                const lineColor =
                  conn.color && /^#[0-9A-Fa-f]{6}$/.test(conn.color)
                    ? conn.color
                    : typeConfig.color;

                // Calculate label position at the midpoint of the full path length
                let totalLength = 0;
                const segmentLengths: number[] = [];
                for (let i = 1; i < fullPath.length; i++) {
                  const dx = fullPath[i][1] - fullPath[i - 1][1];
                  const dy = fullPath[i][0] - fullPath[i - 1][0];
                  const len = Math.sqrt(dx * dx + dy * dy);
                  segmentLengths.push(len);
                  totalLength += len;
                }
                const labelT =
                  totalParallel <= 1
                    ? 0.5
                    : 0.3 + (parallelIndex / (totalParallel - 1)) * 0.4;
                const targetDist = totalLength * labelT;
                let labelPosition: [number, number] = fullPath[fullPath.length - 1];
                let accumulated = 0;
                for (let i = 0; i < segmentLengths.length; i++) {
                  if (accumulated + segmentLengths[i] >= targetDist) {
                    const remainingDist = targetDist - accumulated;
                    const segFraction = segmentLengths[i] > 0 ? remainingDist / segmentLengths[i] : 0;
                    labelPosition = [
                      fullPath[i][0] + (fullPath[i + 1][0] - fullPath[i][0]) * segFraction,
                      fullPath[i][1] + (fullPath[i + 1][1] - fullPath[i][1]) * segFraction,
                    ];
                    break;
                  }
                  accumulated += segmentLengths[i];
                }

                const lineType = conn.lineType || "data";
                const lineLabel = LINE_TYPE_LABELS[lineType] || lineType;
                const sourceName = findLabel(conn.sourceDeviceId);
                const targetName = findLabel(conn.targetDeviceId);

                return (
                  <div key={conn.id}>
                    <Polyline
                      positions={fullPath}
                      pathOptions={{
                        color: lineColor,
                        weight: 3,
                        opacity: 0.8,
                        dashArray: typeConfig.dashArray,
                        lineJoin: 'round',
                        lineCap: 'round',
                      }}
                      eventHandlers={{
                        click: () =>
                          setOpenPopupId(
                            openPopupId === conn.id ? null : conn.id,
                          ),
                      }}
                    />
                    {conn.name && (
                      <Marker
                        position={labelPosition}
                        icon={L.divIcon({
                          html: `<span style="font-size:9px;font-weight:600;color:${lineColor};background:rgba(255,255,255,0.9);padding:1px 5px;border-radius:2px;white-space:nowrap;line-height:1.2;pointer-events:none">${conn.name}</span>`,
                          className: "",
                          iconAnchor: [0, 0],
                        })}
                        interactive={false}
                      />
                    )}
                    <SmartPopup
                      lat={labelPosition[0]}
                      lng={labelPosition[1]}
                      isOpen={openPopupId === conn.id}
                      onClose={() => setOpenPopupId(null)}
                    >
                      <div className="text-sm min-w-[150px]">
                        {conn.name && (
                          <p className="font-medium">{conn.name}</p>
                        )}
                        <p style={{ color: lineColor }}>{lineLabel}</p>
                        <div className="mt-1 text-xs text-muted-foreground">
                          <p>{sourceName} &rarr; {targetName}</p>
                        </div>
                      </div>
                    </SmartPopup>
                  </div>
                );
              })}

              {/* Device Markers */}
              {devices
                .filter((d) => !d.rackCabinId)
                .map((device) => (
                  <Marker
                    key={device.id}
                    position={[device.lat, device.lng]}
                    icon={deviceIcons.get(device.id)}
                    eventHandlers={{
                      click: () =>
                        setOpenPopupId(
                          openPopupId === device.id ? null : device.id,
                        ),
                    }}
                  />
                ))}

              {/* Device Popups */}
              {devices
                .filter((d) => !d.rackCabinId)
                .map((device) => (
                  <SmartPopup
                    key={`popup-${device.id}`}
                    lat={device.lat}
                    lng={device.lng}
                    isOpen={openPopupId === device.id}
                    onClose={() => setOpenPopupId(null)}
                  >
                    <div className="text-sm min-w-[150px]">
                      <p className="font-medium text-popover-foreground">{device.label}</p>
                      <p className="text-muted-foreground">
                        {device.type === "camera" && device.subtype
                          ? tCameraSubtypeLabels[device.subtype as CameraSubtype] ?? tDeviceLabels[device.type]
                          : (tDeviceLabels[device.type] || device.type)}
                      </p>
                      {device.ipAddress && (
                        <p className="mt-1 text-muted-foreground font-mono text-xs">
                          IP: {device.ipAddress}
                        </p>
                      )}
                      {(device.brand || device.model) && (
                        <p className="mt-1 text-muted-foreground text-xs">
                          {[device.brand, device.model].filter(Boolean).join(" · ")}
                        </p>
                      )}
                      {device.serialNumber && (
                        <p className="text-muted-foreground font-mono text-xs">
                          S/N: {device.serialNumber}
                        </p>
                      )}
                      {device.note && (
                        <p className="mt-1 text-muted-foreground italic">
                          {device.note}
                        </p>
                      )}
                      <div className="mt-2 text-xs text-muted-foreground/60">
                        <p>{t("viewer.position", { x: device.lng.toFixed(0), y: device.lat.toFixed(0) })}</p>
                        <p>{t("viewer.rotation", { deg: device.rotation })}</p>
                      </div>
                    </div>
                  </SmartPopup>
                ))}

              {/* Standalone Socket Markers */}
              {sockets
                .filter((s) => !s.workstationId && s.lat != null && s.lng != null)
                .map((socket) => (
                  <Marker
                    key={socket.id}
                    position={[socket.lat!, socket.lng!]}
                    icon={socketIconMap.get(socket.id)}
                    eventHandlers={{
                      click: () =>
                        setOpenPopupId(
                          openPopupId === socket.id ? null : socket.id,
                        ),
                    }}
                  />
                ))}

              {/* Standalone Socket Popups */}
              {sockets
                .filter((s) => !s.workstationId && s.lat != null && s.lng != null)
                .map((socket) => (
                  <SmartPopup
                    key={`popup-${socket.id}`}
                    lat={socket.lat!}
                    lng={socket.lng!}
                    isOpen={openPopupId === socket.id}
                    onClose={() => setOpenPopupId(null)}
                  >
                    <div className="text-sm min-w-[150px]">
                      <p className="font-medium">{socket.label}</p>
                      <p className="text-muted-foreground">
                        {socketLabels[socket.type] || socket.type}
                      </p>
                      {socket.note && (
                        <p className="mt-1 text-muted-foreground italic">
                          {socket.note}
                        </p>
                      )}
                      <div className="mt-2 text-xs text-muted-foreground/60">
                        <p>
                          Position: ({socket.lng!.toFixed(0)},{" "}
                          {socket.lat!.toFixed(0)})
                        </p>
                      </div>
                    </div>
                  </SmartPopup>
                ))}

              {/* Infrastructure Markers */}
              {infrastructure.map((infra) => (
                  <Marker
                    key={infra.id}
                    position={[infra.lat, infra.lng]}
                    icon={infraIconMap.get(infra.id)}
                    eventHandlers={{
                      click: (e) => {
                        e.originalEvent.stopPropagation();
                        setOpenPopupId(
                          openPopupId === infra.id ? null : infra.id,
                        );

                        const mouseEvent = e.originalEvent as MouseEvent;
                        if (mouseEvent.shiftKey) {
                          if (infra.type === InfrastructureType.RACK_CABIN) {
                            setSelectedCabinetId(infra.id);
                            setDrawerOpen(true);
                          } else if (
                            infra.type === InfrastructureType.WORKSTATION
                          ) {
                            setSelectedWorkstationId(infra.id);
                            setWorkstationDrawerOpen(true);
                          }
                        }

                      },
                    }}
                  />
                ))}

              {/* Infrastructure Popups */}
              {infrastructure.map((infra) => (
                <SmartPopup
                  key={`popup-${infra.id}`}
                  lat={infra.lat}
                  lng={infra.lng}
                  isOpen={openPopupId === infra.id}
                  onClose={() => setOpenPopupId(null)}
                >
                  <div className="text-sm min-w-[150px]">
                    <p className="font-medium">{infra.label}</p>
                    <p className="text-muted-foreground">
                      {tInfraLabels[infra.type] || infra.type}
                    </p>
                    {infra.note && (
                      <p className="mt-1 text-muted-foreground italic">{infra.note}</p>
                    )}
                    <div className="mt-2 text-xs text-muted-foreground/60">
                      <p>{t("viewer.position", { x: infra.lng.toFixed(0), y: infra.lat.toFixed(0) })}</p>
                      <p>{t("viewer.rotation", { deg: infra.rotation })}</p>
                    </div>
                    {(infra.type === InfrastructureType.RACK_CABIN ||
                      infra.type === InfrastructureType.WORKSTATION) && (
                      <button
                        className="mt-2 w-full flex items-center justify-center gap-1.5 px-2 py-1.5 bg-primary text-primary-foreground text-xs rounded hover:bg-primary/80 transition-colors"
                        onClick={() => {
                          setOpenPopupId(null);
                          if (infra.type === InfrastructureType.RACK_CABIN) {
                            setSelectedCabinetId(infra.id);
                            setDrawerOpen(true);
                          } else {
                            setSelectedWorkstationId(infra.id);
                            setWorkstationDrawerOpen(true);
                          }
                        }}
                      >
                        <PanelRightOpen className="h-3.5 w-3.5" />
                        Open
                      </button>
                    )}
                  </div>
                </SmartPopup>
              ))}
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
            .filter((d) => d.rackCabinId === cabinet.infraId)
            .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
          return (
            <RackCabinDetailDrawer
              open={drawerOpen}
              onOpenChange={setDrawerOpen}
              cabinetId={cabinet.infraId}
              cabinetName={cabinet.label}
              cabinetNote={cabinet.note}
              childDevices={childDevicesForCabinet.map((d) => ({
                id: d.deviceId,
                name: d.label,
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
                  id: d.deviceId,
                  name: d.label,
                  type: d.type,
                })),
                ...infrastructure.map((i) => ({
                  id: i.infraId,
                  name: i.label,
                  type: i.type,
                })),
              ]}
              isEditable={false}
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
            .filter((s) => s.workstationId === workstation.infraId)
            .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
          return (
            <WorkstationDetailDrawer
              open={workstationDrawerOpen}
              onOpenChange={setWorkstationDrawerOpen}
              workstationName={workstation.label}
              workstationNote={workstation.note}
              childSockets={childSocketsForWorkstation.map((s) => ({
                id: s.id,
                name: s.label,
                type: s.type,
                note: s.note,
              }))}
              isEditable={false}
            />
          );
        })()}

      {/* Delete Topology Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("viewer.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("viewer.deleteDescription", { name: selectedTopology?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{t("viewer.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteTopology();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {t("viewer.deleting")}
                </>
              ) : (
                t("viewer.delete")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isUnassignDialogOpen} onOpenChange={setIsUnassignDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("viewer.unassignTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("viewer.unassignDescription", { name: selectedTopology?.name, clients: selectedTopology?.clientUsernames?.join(", ") })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUnassigning}>{t("viewer.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleUnassignTopology();
              }}
              disabled={isUnassigning}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isUnassigning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {t("viewer.unassigning")}
                </>
              ) : (
                t("viewer.unassign")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
