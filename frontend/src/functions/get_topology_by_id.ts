import { getSessionToken } from "./get_session_token";
import type { Topology } from "./get_topologies_by_client";

export type { Topology };

async function getTopologyById(topologyId: string): Promise<Topology> {
  const token = getSessionToken();

  if (!token) {
    throw new Error("No authentication token found");
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const response = await fetch(`/api/topologies/${topologyId}`, { headers });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `Server error: ${response.status}`);
  }

  return await response.json() as Topology;
}

export default getTopologyById;
