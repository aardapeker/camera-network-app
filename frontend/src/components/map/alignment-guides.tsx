import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import { ALIGNMENT_GUIDE_COLOR } from "~/constants/colors";

export const ALIGNMENT_DRAG_EVENT = "topology:marker-drag";
export const ALIGNMENT_DRAG_END_EVENT = "topology:marker-dragend";

export interface AlignmentDragPayload {
  lat: number;
  lng: number;
  id: string;
}

/** Pixel distance within which the dragged marker snaps to an axis. */
const SNAP_THRESHOLD = 1.5;

/**
 * Module-level registry populated by AlignmentGuides so marker drag handlers
 * can call snapPosition() synchronously without prop drilling.
 */
let _snapFn: ((lat: number, lng: number, id: string) => { lat: number; lng: number }) | null = null;

export function snapPosition(lat: number, lng: number, id: string): { lat: number; lng: number } {
  return _snapFn ? _snapFn(lat, lng, id) : { lat, lng };
}

interface MarkerPosition {
  id: string;
  lat: number;
  lng: number;
}

interface AlignmentGuidesProps {
  allPositions: MarkerPosition[];
  threshold?: number;
}

/**
 * Draws horizontal/vertical alignment guide lines while dragging a marker.
 *
 * The SVG is mounted on document.body as a fixed overlay aligned to the map
 * container rect. This avoids all Leaflet pane clipping issues. Lines are
 * drawn synchronously from custom window events, bypassing React re-renders.
 */
export function AlignmentGuides({
  allPositions,
  threshold = 0.25,
}: AlignmentGuidesProps) {
  const map = useMap();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const allPositionsRef = useRef(allPositions);

  useEffect(() => {
    allPositionsRef.current = allPositions;
  }, [allPositions]);

  // Register the snap function so marker drag handlers can call snapPosition().
  useEffect(() => {
    _snapFn = (lat, lng, id) => {
      const dragPx = map.latLngToContainerPoint([lat, lng]);
      const others = allPositionsRef.current.filter((p) => p.id !== id);

      let snappedX = dragPx.x;
      let snappedY = dragPx.y;
      let closestDx = SNAP_THRESHOLD;
      let closestDy = SNAP_THRESHOLD;

      for (const pos of others) {
        const px = map.latLngToContainerPoint([pos.lat, pos.lng]);
        const dy = Math.abs(dragPx.y - px.y);
        const dx = Math.abs(dragPx.x - px.x);
        // Keep the closest match for each axis independently.
        if (dy <= SNAP_THRESHOLD && dy <= closestDy) { snappedY = px.y; closestDy = dy; }
        if (dx <= SNAP_THRESHOLD && dx <= closestDx) { snappedX = px.x; closestDx = dx; }
      }

      if (snappedX === dragPx.x && snappedY === dragPx.y) return { lat, lng };
      return map.containerPointToLatLng([snappedX, snappedY]);
    };
    return () => { _snapFn = null; };
  }, [map]);

  // Create a fixed SVG overlay on document.body.
  // The SVG is pinned to (0,0) full-viewport and we offset line coordinates
  // by the container rect at draw time — this avoids stale positioning on
  // mobile where the toolbar height changes without a resize event.
  useEffect(() => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svg.style.cssText =
      "position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:9000;overflow:visible";

    document.body.appendChild(svg);
    svgRef.current = svg;

    return () => {
      if (svg.parentNode) svg.parentNode.removeChild(svg);
      svgRef.current = null;
    };
  }, [map]);

  // Listen for drag events and draw lines synchronously.
  useEffect(() => {
    const onDrag = (e: Event) => {
      const svg = svgRef.current;
      if (!svg) return;

      const { lat, lng, id } = (e as CustomEvent<AlignmentDragPayload>).detail;

      while (svg.firstChild) svg.removeChild(svg.firstChild);

      // Read the container rect fresh on every drag event so mobile toolbar
      // show/hide (which doesn't fire resize) never causes stale offsets.
      const rect = map.getContainer().getBoundingClientRect();

      // containerPoint is relative to the container's top-left.
      // Add rect.left / rect.top to convert to viewport (fixed) coordinates.
      const dragPx = map.latLngToContainerPoint([lat, lng]);
      const others = allPositionsRef.current.filter((p) => p.id !== id);

      for (const pos of others) {
        const px = map.latLngToContainerPoint([pos.lat, pos.lng]);
        const dx = Math.abs(dragPx.x - px.x);
        const dy = Math.abs(dragPx.y - px.y);

        // Viewport-absolute coordinates for the matched marker.
        const vpx = px.x + rect.left;
        const vpy = px.y + rect.top;

        if (dy <= threshold) {
          svg.appendChild(makeLine(0, vpy, window.innerWidth, vpy));
          svg.appendChild(makeHighlight(vpx, vpy));
        }
        if (dx <= threshold) {
          svg.appendChild(makeLine(vpx, 0, vpx, window.innerHeight));
          svg.appendChild(makeHighlight(vpx, vpy));
        }
      }
    };

    const onDragEnd = () => {
      const svg = svgRef.current;
      if (!svg) return;
      while (svg.firstChild) svg.removeChild(svg.firstChild);
    };

    window.addEventListener(ALIGNMENT_DRAG_EVENT, onDrag);
    window.addEventListener(ALIGNMENT_DRAG_END_EVENT, onDragEnd);
    return () => {
      window.removeEventListener(ALIGNMENT_DRAG_EVENT, onDrag);
      window.removeEventListener(ALIGNMENT_DRAG_END_EVENT, onDragEnd);
    };
  }, [map, threshold]);

  return null;
}

function makeLine(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): SVGLineElement {
  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", String(x1));
  line.setAttribute("y1", String(y1));
  line.setAttribute("x2", String(x2));
  line.setAttribute("y2", String(y2));
  line.setAttribute("stroke", ALIGNMENT_GUIDE_COLOR);
  line.setAttribute("stroke-width", "1.5");
  line.setAttribute("stroke-dasharray", "6 4");
  line.setAttribute("opacity", "0.9");
  return line;
}

// Inject the pulse keyframe once into the document.
let pulseStyleInjected = false;
function ensurePulseStyle() {
  if (pulseStyleInjected) return;
  pulseStyleInjected = true;
  const style = document.createElement("style");
  style.textContent = `
    @keyframes alignment-pulse {
      0%   { r: 10; opacity: 0.9; }
      70%  { r: 20; opacity: 0.3; }
      100% { r: 10; opacity: 0.0; }
    }
    .alignment-pulse-ring {
      animation: alignment-pulse 1s ease-out infinite;
      transform-box: fill-box;
      transform-origin: center;
    }
  `;
  document.head.appendChild(style);
}

function makeHighlight(cx: number, cy: number): SVGGElement {
  ensurePulseStyle();
  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");

  // Solid inner dot.
  const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  dot.setAttribute("cx", String(cx));
  dot.setAttribute("cy", String(cy));
  dot.setAttribute("r", "5");
  dot.setAttribute("fill", ALIGNMENT_GUIDE_COLOR);
  dot.setAttribute("opacity", "0.9");

  // Pulsing outer ring.
  const ring = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  ring.setAttribute("cx", String(cx));
  ring.setAttribute("cy", String(cy));
  ring.setAttribute("r", "10");
  ring.setAttribute("fill", "none");
  ring.setAttribute("stroke", ALIGNMENT_GUIDE_COLOR);
  ring.setAttribute("stroke-width", "2");
  ring.setAttribute("class", "alignment-pulse-ring");

  g.appendChild(ring);
  g.appendChild(dot);
  return g;
}
