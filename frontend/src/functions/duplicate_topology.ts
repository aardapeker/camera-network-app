import { getSessionToken } from "./get_session_token";

interface DuplicateTopologyResponse {
  id: string;
  name: string;
  blueprintPictureUrl: string;
  createdAt: string;
}

async function duplicateTopology(
  topologyId: string,
): Promise<DuplicateTopologyResponse> {
  const token = getSessionToken();

  if (!token) {
    throw new Error("No authentication token found");
  }

  if (!topologyId || topologyId.trim() === "") {
    throw new Error("Topology ID is required");
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const response = await fetch(`/api/topologies/${topologyId}/duplicate`, {
    method: "POST",
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Server error: ${response.status}`);
  }

  return await response.json();
}

export default duplicateTopology;
