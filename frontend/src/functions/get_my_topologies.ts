import { getSessionToken } from "./get_session_token";
import type { Topology } from "./get_topologies_by_client";

export type { Topology };

interface TopologyListResponse {
  topologies: Topology[];
  count: number;
  message: string | null;
}

export interface MyTopologyFilterParams {
  search?: string | null;
  sortBy?: string | null;
  sortDirection?: string | null;
}

async function getMyTopologies(params?: MyTopologyFilterParams): Promise<Topology[]> {
  const token = getSessionToken();

  if (!token) {
    throw new Error("No authentication token found");
  }

  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.sortBy) query.set("sortBy", params.sortBy);
  if (params?.sortDirection) query.set("sortDirection", params.sortDirection);

  const url = `/api/topologies/my${query.toString() ? `?${query.toString()}` : ""}`;
  const response = await fetch(url, {
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

export default getMyTopologies;
