/**
 * Line geometry utilities for topology connections
 * Note: In Leaflet's coordinate system, [lat, lng] = [y, x]
 */

/**
 * Shorten a line by margin amount from both ends (to not overlap with icons)
 */
export function shortenLine(
  source: [number, number],
  target: [number, number],
  margin: number,
): [[number, number], [number, number]] {
  // source and target are [lat, lng] which is [y, x]
  const dx = target[1] - source[1]; // difference in lng (x)
  const dy = target[0] - source[0]; // difference in lat (y)
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length < margin * 2) {
    return [source, target];
  }

  // Unit vector in the direction from source to target
  const unitLat = dy / length;
  const unitLng = dx / length;
  const ratio = margin;

  const newSource: [number, number] = [
    source[0] + unitLat * ratio,
    source[1] + unitLng * ratio,
  ];
  const newTarget: [number, number] = [
    target[0] - unitLat * ratio,
    target[1] - unitLng * ratio,
  ];

  return [newSource, newTarget];
}

/**
 * Offset a line perpendicular to its direction for parallel lines
 */
export function offsetLine(
  source: [number, number],
  target: [number, number],
  offsetAmount: number,
): [[number, number], [number, number]] {
  // source and target are [lat, lng] which is [y, x]
  const dx = target[1] - source[1]; // difference in lng (x)
  const dy = target[0] - source[0]; // difference in lat (y)
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length === 0) return [source, target];

  // Perpendicular unit vector (rotate 90 degrees clockwise)
  // For a vector (dx, dy), perpendicular is (dy, -dx) or (-dy, dx)
  // We use (-dy, dx) normalized, but need to apply to [lat, lng] format
  const perpLat = -dx / length; // perpendicular in lat direction
  const perpLng = dy / length; // perpendicular in lng direction

  const newSource: [number, number] = [
    source[0] + perpLat * offsetAmount,
    source[1] + perpLng * offsetAmount,
  ];
  const newTarget: [number, number] = [
    target[0] + perpLat * offsetAmount,
    target[1] + perpLng * offsetAmount,
  ];

  return [newSource, newTarget];
}

/**
 * Offset a multi-point polyline perpendicular to each segment's direction.
 * Used for parallel cable offset when waypoints are present.
 */
export function offsetPolyline(
  points: [number, number][],
  offsetAmount: number,
): [number, number][] {
  if (points.length < 2 || offsetAmount === 0) return points;

  return points.map((point, i) => {
    // For each point, compute the average perpendicular from adjacent segments
    const prevPoint = i > 0 ? points[i - 1] : null;
    const nextPoint = i < points.length - 1 ? points[i + 1] : null;

    let perpLat = 0;
    let perpLng = 0;
    let count = 0;

    if (prevPoint) {
      const dx = point[1] - prevPoint[1];
      const dy = point[0] - prevPoint[0];
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len > 0) {
        perpLat += -dx / len;
        perpLng += dy / len;
        count++;
      }
    }

    if (nextPoint) {
      const dx = nextPoint[1] - point[1];
      const dy = nextPoint[0] - point[0];
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len > 0) {
        perpLat += -dx / len;
        perpLng += dy / len;
        count++;
      }
    }

    if (count === 0) return point;

    perpLat /= count;
    perpLng /= count;

    return [
      point[0] + perpLat * offsetAmount,
      point[1] + perpLng * offsetAmount,
    ] as [number, number];
  });
}

/**
 * Generate a unique ID for devices, connections, etc.
 */
export function generateId(): string {
  return `dev-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Get the next incremental name for a device/infrastructure
 * e.g., "Camera", "Camera 2", "Camera 3"
 */
export function getNextIncrementalName(
  baseLabel: string,
  existingNames: string[],
): string {
  // Check if the base label (without number) is available
  const hasBaseName = existingNames.includes(baseLabel);
  if (!hasBaseName) {
    return baseLabel;
  }

  // Find all used numbers from names like "BaseLabel N"
  const pattern = new RegExp(`^${baseLabel} (\\d+)$`);
  const usedNumbers: number[] = [];

  for (const name of existingNames) {
    const match = name.match(pattern);
    if (match) {
      usedNumbers.push(parseInt(match[1], 10));
    }
  }

  // Find the next available number starting from 2
  let nextNum = 2;
  while (usedNumbers.includes(nextNum)) {
    nextNum++;
  }

  return `${baseLabel} ${nextNum}`;
}

/**
 * Get the next sequential device name for a configurable prefix + starting number,
 * e.g. prefix "cam", startNumber 3 -> "cam3", "cam4", "cam5" (always the highest used + 1, never fills gaps).
 */
export function getNextDeviceName(
  prefix: string,
  startNumber: number,
  existingNames: string[],
): string {
  const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^${escapedPrefix}(\\d+)$`);

  let maxNumber = startNumber - 1;
  for (const name of existingNames) {
    const match = name.match(pattern);
    if (match) {
      maxNumber = Math.max(maxNumber, parseInt(match[1], 10));
    }
  }

  return `${prefix}${maxNumber + 1}`;
}

/**
 * Get the next sequential IP address for a configurable starting IP, incrementing the last octet,
 * e.g. startIp "192.168.10.40" -> "192.168.10.41", "192.168.10.42" (always the highest used + 1).
 */
export function getNextDeviceIp(
  startIp: string,
  existingIps: (string | null | undefined)[],
): string {
  const lastDot = startIp.lastIndexOf(".");
  if (lastDot === -1) return startIp;

  const base = startIp.slice(0, lastDot + 1);
  const startLastOctet = parseInt(startIp.slice(lastDot + 1), 10);
  if (isNaN(startLastOctet)) return startIp;

  let maxLastOctet = startLastOctet - 1;
  for (const ip of existingIps) {
    if (ip && ip.startsWith(base)) {
      const lastOctet = parseInt(ip.slice(base.length), 10);
      if (!isNaN(lastOctet)) {
        maxLastOctet = Math.max(maxLastOctet, lastOctet);
      }
    }
  }

  return `${base}${maxLastOctet + 1}`;
}
