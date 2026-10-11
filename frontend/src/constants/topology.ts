import L from "leaflet";
import type { LineType } from "~/types";
import { CABLE_COLORS } from "~/constants/colors";

// Default bounds for the map
export const DEFAULT_BOUNDS: L.LatLngBoundsExpression = [
  [0, 0],
  [800, 1000],
];

// Line type labels for PDF export and display
export const LINE_TYPE_LABELS: Record<LineType, string> = {
  data: "Data Cable (Ethernet)",
  fiber: "Fiber Optic",
  electric: "Electric Cable",
  coaxial: "Coaxial Cable",
};

// Line type configurations (colors and dash patterns)
export const LINE_TYPES: Record<
  LineType,
  { color: string; dashArray?: string }
> = {
  data: { color: CABLE_COLORS.data, dashArray: undefined },
  fiber: { color: CABLE_COLORS.fiber, dashArray: "15, 5" },
  electric: { color: CABLE_COLORS.electric, dashArray: "5, 5" },
  coaxial: { color: CABLE_COLORS.coaxial, dashArray: "10, 3, 2, 3" },
};

// Margin in map units to offset line from icon center
export const ICON_MARGIN = 20;

// Offset distance for parallel lines
export const PARALLEL_OFFSET = 5;

// Distance threshold (in map units) for detecting if dropped on a rack cabin
export const RACK_CABIN_DROP_THRESHOLD = 40;

