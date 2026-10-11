/**
 * Timezone utilities for chart date math.
 * Uses the Intl API — no extra dependency required.
 */

export const TIMEZONES = [
  { label: "Turkey (UTC+3)", value: "Europe/Istanbul" },
  { label: "UTC", value: "UTC" },
  { label: "London (UTC+0/+1)", value: "Europe/London" },
  { label: "Berlin / Paris (UTC+1/+2)", value: "Europe/Berlin" },
  { label: "Moscow (UTC+3)", value: "Europe/Moscow" },
  { label: "Dubai (UTC+4)", value: "Asia/Dubai" },
  { label: "Karachi (UTC+5)", value: "Asia/Karachi" },
  { label: "New York (UTC-5/-4)", value: "America/New_York" },
  { label: "Chicago (UTC-6/-5)", value: "America/Chicago" },
  { label: "Los Angeles (UTC-8/-7)", value: "America/Los_Angeles" },
  { label: "São Paulo (UTC-3)", value: "America/Sao_Paulo" },
  { label: "Tokyo (UTC+9)", value: "Asia/Tokyo" },
  { label: "Singapore (UTC+8)", value: "Asia/Singapore" },
  { label: "Sydney (UTC+10/+11)", value: "Australia/Sydney" },
];

export const DEFAULT_TIMEZONE = "Europe/Istanbul";

/**
 * Convert a UTC date string (from the backend) into a Date-like object
 * whose local getHours/getDate/getMonth/getFullYear values reflect the
 * target timezone — achieved by formatting then re-parsing via Intl.
 */
export function toTzDate(utcString: string, timezone: string): Date {
  // Backend sends LocalDateTime without Z — treat as UTC
  const normalized = utcString.endsWith("Z") ? utcString : utcString + "Z";

  // Format the instant in the target timezone as an ISO-like string
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date(normalized));

  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "00";

  // Reconstruct as a local Date (the numeric fields will be in the target tz)
  return new Date(
    `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}`,
  );
}

/** "now" expressed in the target timezone (as a local Date) */
export function nowInTz(timezone: string): Date {
  return toTzDate(new Date().toISOString(), timezone);
}
