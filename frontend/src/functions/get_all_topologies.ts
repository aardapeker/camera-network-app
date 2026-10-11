import { getSessionToken } from "./get_session_token";
import type { Topology } from "./get_topologies_by_client";

export type { Topology };

interface TopologyListResponse {
  topologies: Topology[];
  count: number;
  message: string | null;
}

export interface TopologyFilterParams {
  search?: string | null;
  sortBy?: string | null;
  sortDirection?: string | null;
  assigned?: string | null;
  creator?: string | null;
}

async function getAllTopologies(params?: TopologyFilterParams): Promise<Topology[]> {
  const token = getSessionToken();

  if (!token) {
    throw new Error("No authentication token found");
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.sortBy) query.set("sortBy", params.sortBy);
  if (params?.sortDirection) query.set("sortDirection", params.sortDirection);
  if (params?.assigned) query.set("assigned", params.assigned);
  if (params?.creator) query.set("creator", params.creator);

  const url = `/api/topologies${query.toString() ? `?${query.toString()}` : ""}`;
  const response = await fetch(url, { headers });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `Server error: ${response.status}`);
  }

  const data: TopologyListResponse = await response.json();
  return data.topologies;
}

export default getAllTopologies;
