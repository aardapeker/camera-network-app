import type { PaginatedNetworkScanResponse } from "~/types";
import { getSessionToken } from "./get_session_token";

interface GetNetworkScansParams {
  filterInput: string | null;
  filterBy: "all" | "ip" | "hostname" | "vendor" | null;
  sources: string[] | null;
  page: string | null;
  size: string | null;
  sortBy: string | null;
  sortDirection: "ASC" | "DESC" | null;
}

function authHeaders(): HeadersInit {
  const token = getSessionToken();
  if (!token) throw new Error("No authentication token found");
  return { Authorization: `Bearer ${token}` };
}

async function handle<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `Server error: ${response.status}`);
  }
  return response.status === 204 ? (undefined as T) : await response.json();
}

export async function getNetworkScans({
  filterInput,
  filterBy,
  sources,
  page,
  size,
  sortBy,
  sortDirection,
}: GetNetworkScansParams): Promise<PaginatedNetworkScanResponse> {
  const params = new URLSearchParams();

  if (page) params.append("page", page);
  if (size) params.append("size", size);
  if (sortBy) params.append("sortBy", sortBy);
  if (sortDirection) params.append("sortDirection", sortDirection);

  if (filterInput && filterBy) {
    params.append("filterInput", filterInput);
    params.append("filterBy", filterBy);
  }

  if (sources && sources.length > 0) {
    params.append("sources", sources.join(","));
  }

  const response = await fetch(`/api/network-scans?${params}`, {
    headers: authHeaders(),
  });
  return handle(response);
}

export async function getNetworkScanSources(): Promise<string[]> {
  const response = await fetch("/api/network-scans/sources", {
    headers: authHeaders(),
  });
  return handle(response);
}
