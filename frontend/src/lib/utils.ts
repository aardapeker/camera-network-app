import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function findNearest<T extends { lat: number; lng: number }>(
  items: T[],
  point: L.LatLng,
): T | null {
  let nearest: T | null = null;
  let minDistance = Infinity;
  const SOCKET_DROP_THRESHOLD = 40;

  for (const item of items) {
    const distance = Math.hypot(point.lat - item.lat, point.lng - item.lng);

    if (distance < SOCKET_DROP_THRESHOLD && distance < minDistance) {
      minDistance = distance;
      nearest = item;
    }
  }

  return nearest;
}
