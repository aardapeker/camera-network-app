import { useEffect } from "react";
import { useMapEvents } from "react-leaflet";
import L from "leaflet";
import { toast } from "sonner";
import i18n from "~/lib/i18n";
import { DeviceType, InfrastructureType, SocketType } from "~/components/icons";
import { RACK_CABIN_DROP_THRESHOLD } from "~/constants/topology";
import { findNearest } from "~/lib/utils";
import type { LeafletInfrastructure } from "~/types/topology";
import { getTouchDragData, clearTouchDragData } from "~/lib/touch-drag";

interface MapEventsProps {
  infrastructure: LeafletInfrastructure[];
  onAddDevice: (
    type: DeviceType,
    lat: number,
    lng: number,
    rackCabinId?: string,
  ) => void;
  onAddSocket: (
    type: SocketType,
    lat: number,
    lng: number,
    workstationId?: string | null,
  ) => void;
  onAddInfrastructure: (
    type: InfrastructureType,
    lat: number,
    lng: number,
  ) => void;
  connectionMode: boolean;
  isLocked: boolean;
  onClearSelection: () => void;
}

/**
 * Component to handle map events like click and drag-drop.
 * Handles device/infrastructure dropping onto the map and rack cabins.
 */
export function MapEvents({
  infrastructure,
  onAddDevice,
  onAddSocket,
  onAddInfrastructure,
  connectionMode,
  isLocked,
  onClearSelection,
}: MapEventsProps) {
  const map = useMapEvents({
    click: () => {
      onClearSelection();
    },
  });

  useEffect(() => {
    const container = map.getContainer();
    if (!container) return;

    /**
     * Shared drop logic used by both mouse (HTML5 drag) and touch events.
     * clientX/clientY are the coordinates where the item was released.
     */
    const handleDrop = (
      clientX: number,
      clientY: number,
      deviceType: string | null,
      socketType: string | null,
      infraType: string | null,
    ) => {
      if (connectionMode) {
        toast.error(i18n.t("map.droppingFailed"), {
          description: i18n.t("map.exitConnectionFirst"),
        });
        return;
      }

      if (isLocked) {
        toast.error(i18n.t("map.canvasLocked"), {
          description: i18n.t("map.unlockToAdd"),
        });
        return;
      }

      const rect = container.getBoundingClientRect();
      const point = L.point(clientX - rect.left, clientY - rect.top);
      const latlng = map.containerPointToLatLng(point);

      if (deviceType) {
        const rackCabins = infrastructure.filter(
          (i) => i.type === InfrastructureType.RACK_CABIN,
        );
        let nearestRackCabin: LeafletInfrastructure | null = null;
        let minDistance = Infinity;

        for (const cabin of rackCabins) {
          const distance = Math.sqrt(
            Math.pow(latlng.lat - cabin.lat, 2) +
              Math.pow(latlng.lng - cabin.lng, 2),
          );
          if (distance < RACK_CABIN_DROP_THRESHOLD && distance < minDistance) {
            minDistance = distance;
            nearestRackCabin = cabin;
          }
        }

        if (nearestRackCabin) {
          onAddDevice(
            deviceType as DeviceType,
            nearestRackCabin.lat,
            nearestRackCabin.lng,
            nearestRackCabin.id,
          );
        } else {
          onAddDevice(deviceType as DeviceType, latlng.lat, latlng.lng);
        }
        return;
      }

      if (socketType) {
        const workstations = infrastructure.filter(
          (i) => i.type === InfrastructureType.WORKSTATION,
        );

        const nearestWs = findNearest(workstations, latlng);
        if (nearestWs) {
          onAddSocket(socketType as SocketType, nearestWs.lat, nearestWs.lng, nearestWs.id);
          toast.success(i18n.t("map.socketAdded"));
        } else {
          onAddSocket(socketType as SocketType, latlng.lat, latlng.lng, null);
          toast.success(i18n.t("map.standaloneSocketAdded"));
        }
        return;
      }

      if (infraType) {
        onAddInfrastructure(infraType as InfrastructureType, latlng.lat, latlng.lng);
      }
    };

    // ── HTML5 drag and drop (desktop) ──────────────────────────────────────
    const onDragOver = (e: DragEvent) => e.preventDefault();

    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      const deviceType = e.dataTransfer?.getData("deviceType") ?? null;
      const socketType = e.dataTransfer?.getData("socketType") ?? null;
      const infraType = e.dataTransfer?.getData("infrastructureType") ?? null;
      handleDrop(e.clientX, e.clientY, deviceType, socketType, infraType);
    };

    // ── Touch drag and drop (mobile / small screen) ────────────────────────
    const onTouchEnd = (e: TouchEvent) => {
      const data = getTouchDragData();
      if (!data) return;

      clearTouchDragData();

      const touch = e.changedTouches[0];
      if (!touch) return;

      // Check that the finger was released over the map container
      const rect = container.getBoundingClientRect();
      const x = touch.clientX;
      const y = touch.clientY;
      if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        return;
      }

      const deviceType = data.kind === "device" ? data.type : null;
      const socketType = data.kind === "socket" ? data.type : null;
      const infraType = data.kind === "infrastructure" ? data.type : null;
      handleDrop(x, y, deviceType, socketType, infraType);
    };

    container.addEventListener("dragover", onDragOver);
    container.addEventListener("drop", onDrop);
    // Use document for touchend so we catch the event even when the finger
    // slides from the sidebar onto the map without triggering the container's
    // own touch listeners.
    document.addEventListener("touchend", onTouchEnd);
    return () => {
      container.removeEventListener("dragover", onDragOver);
      container.removeEventListener("drop", onDrop);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [
    map,
    infrastructure,
    onAddDevice,
    onAddSocket,
    onAddInfrastructure,
    connectionMode,
    isLocked,
  ]);

  return null;
}
