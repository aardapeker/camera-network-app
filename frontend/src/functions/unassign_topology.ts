import { getSessionToken } from "./get_session_token";

export default async function unassignTopology(topologyId: string): Promise<void> {
  const token = getSessionToken();
  if (!token) throw new Error("No authentication token found");

  const response = await fetch(`/api/topologies/${topologyId}/unassign`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `Server error: ${response.status}`);
  }
}
