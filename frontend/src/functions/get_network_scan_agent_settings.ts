import { getSessionToken } from "./get_session_token";

export interface ScanAgentSettings {
  sourceId: string;
  retentionDays: number;
  minWriteIntervalSeconds: number;
  retentionIsDefault: boolean;
  intervalIsDefault: boolean;
}

function authHeaders(json = false): HeadersInit {
  const token = getSessionToken();
  if (!token) throw new Error("No authentication token found");
  return json
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { Authorization: `Bearer ${token}` };
}

async function handle<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `Server error: ${response.status}`);
  }
  return response.status === 204 ? (undefined as T) : await response.json();
}

export async function getAgentSettings(): Promise<ScanAgentSettings[]> {
  const response = await fetch("/api/network-scans/agent-settings", {
    headers: authHeaders(),
  });
  return handle(response);
}

export async function saveAgentSettings(
  sourceId: string,
  retentionDays: number,
  minWriteIntervalSeconds: number,
): Promise<ScanAgentSettings> {
  const response = await fetch(`/api/network-scans/agent-settings/${sourceId}`, {
    method: "PUT",
    headers: authHeaders(true),
    body: JSON.stringify({ retentionDays, minWriteIntervalSeconds }),
  });
  return handle(response);
}
