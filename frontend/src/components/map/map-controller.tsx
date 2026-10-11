import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

interface MapControllerProps {
  bounds: L.LatLngBoundsExpression;
}

/**
 * Component to control map bounds - fits the map to the provided bounds
 * and sets the max bounds to prevent panning outside.
 */
export function MapController({ bounds }: MapControllerProps) {
  const map = useMap();

  useEffect(() => {
    map.fitBounds(bounds);
    map.setMaxBounds(bounds);
  }, [map, bounds]);

  return null;
}
