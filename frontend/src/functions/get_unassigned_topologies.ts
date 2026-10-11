import { getSessionToken } from "./get_session_token";
import type { Topology } from "./get_topologies_by_client";

export type { Topology };

interface TopologyListResponse {
  topologies: Topology[];
  count: number;
  message: string | null;
}

async function getUnassignedTopologies(): Promise<Topology[]> {
  const token = getSessionToken();

  if (!token) {
    throw new Error("No authentication token found");
  }

  const response = await fetch("/api/topologies/unassigned", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `Server error: ${response.status}`);
  }

  const data: TopologyListResponse = await response.json();
  return data.topologies;
}

export default getUnassignedTopologies;
