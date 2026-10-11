/**
 * Shared state for touch-based drag and drop.
 * Bridges the gap between touch events on sidebar items and the map drop zone,
 * since HTML5 drag events are not fired on mobile/touch devices.
 */

export type TouchDragData =
  | { kind: "device"; type: string }
  | { kind: "infrastructure"; type: string }
  | { kind: "socket"; type: string };

let _current: TouchDragData | null = null;
let _ghost: HTMLElement | null = null;

export function setTouchDragData(data: TouchDragData) {
  _current = data;
}

export function getTouchDragData(): TouchDragData | null {
  return _current;
}

export function clearTouchDragData() {
  _current = null;
}

export function setTouchGhost(el: HTMLElement | null) {
  _ghost = el;
}

export function getTouchGhost(): HTMLElement | null {
  return _ghost;
}
