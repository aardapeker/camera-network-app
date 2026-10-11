import { useEffect } from "react";
import { useMap } from "react-leaflet";

interface FocusTarget {
  lat: number;
  lng: number;
  /** Bumped on every request so re-focusing the same component still pans. */
  nonce: number;
}

interface FocusControllerProps {
  target: FocusTarget | null;
}

/**
 * Pans the map to a requested component, e.g. when one is clicked in the
 * sidebar. Keeps the current zoom so the user does not lose their scale.
 */
export function FocusController({ target }: FocusControllerProps) {
  const map = useMap();

  useEffect(() => {
    if (!target) return;
    try {
      map.panTo([target.lat, target.lng], { animate: true, duration: 0.4 });
    } catch {
      // Map may be mid-destroy (e.g. key change remounting MapContainer)
    }
  }, [map, target]);

  return null;
}
