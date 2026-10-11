import { useEffect } from "react";
import { useMap } from "react-leaflet";

interface ZoomControllerProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
}

/**
 * Component to sync zoom state between the map and external state.
 * Converts between linear zoom (1, 2, 3...) and logarithmic zoom levels.
 */
export function ZoomController({ zoom, onZoomChange }: ZoomControllerProps) {
  const map = useMap();

  useEffect(() => {
    const currentZoom = map.getZoom();
    const targetZoom = Math.log2(zoom) + 1;
    if (Math.abs(currentZoom - targetZoom) > 0.1) {
      map.setZoom(targetZoom);
    }
  }, [map, zoom]);

  useEffect(() => {
    const handleZoomEnd = () => {
      const newZoom = Math.pow(2, map.getZoom() - 1);
      onZoomChange(newZoom);
    };
    map.on("zoomend", handleZoomEnd);
    return () => {
      map.off("zoomend", handleZoomEnd);
    };
  }, [map, onZoomChange]);

  return null;
}
