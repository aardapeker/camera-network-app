// ============================================================
// CENTRAL COLOR CONSTANTS
// All semantic colors used across the app are defined here.
// Chart palette uses CSS variables so they respond to theme changes.
// To change the chart palette, edit --chart-1 through --chart-5 in app.css.
// ============================================================

// --- Chart palette (up to 10 series) ---
export const CHART_COLORS: string[] = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-1)",  // repeats with lower opacity if needed beyond 5
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

// --- Cable / connection line colors ---
export const CABLE_COLORS = {
  data: "var(--chart-1)",
  fiber: "var(--chart-3)",
  electric: "var(--chart-5)",
  coaxial: "var(--chart-2)",
} as const;

// Hex equivalents for canvas/PDF contexts where CSS vars don't resolve
export const CABLE_COLORS_HEX = {
  data: "#3b82f6",
  fiber: "#f97316",
  electric: "#ef4444",
  coaxial: "#8b5cf6",
} as const;

// --- Device type default colors ---
// NOTE: Must be hex — rendered via renderToStaticMarkup in Leaflet icons.
export const DEVICE_COLORS = {
  camera: "#3b82f6",
  switch: "#8b5cf6",
  nvr: "#14b8a6",
  router: "#f59e0b",
  access_point: "#ec4899",
  ups: "#ef4444",
  horn_speaker: "#f97316",
} as const;

// --- Infrastructure type default colors ---
// NOTE: Must be hex — rendered via renderToStaticMarkup in Leaflet icons.
export const INFRASTRUCTURE_COLORS = {
  rack_cabin: "#10b981",
  workstation: "#6366f1",
} as const;

// --- Socket type colors ---
// NOTE: Must be hex — rendered via renderToStaticMarkup in Leaflet icons.
export const SOCKET_COLORS = {
  ups: "#ef4444",
  cat6: "#3b82f6",
  normal: "#6b7280",
} as const;

// --- Geographic heatmap intensity scale (low → high) ---
export const GEO_HEATMAP_COLORS: string[] = [
  "var(--chart-5)",
  "var(--chart-4)",
  "var(--chart-3)",
  "var(--chart-2)",
  "var(--chart-1)",
  "var(--chart-1)",
];

// --- Fallback / neutral ---
export const COLOR_FALLBACK = "var(--muted-foreground)";

// Hex fallback for contexts that cannot resolve CSS variables
// (e.g. color pickers, canvas rendering, renderToStaticMarkup)
export const COLOR_FALLBACK_HEX = "#6b7280";

// Alignment guide color (used in SVG DOM setAttribute — must be hex)
export const ALIGNMENT_GUIDE_COLOR = "#3b82f6";
