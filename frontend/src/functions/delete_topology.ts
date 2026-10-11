import { getSessionToken } from "./get_session_token";

async function deleteTopology(topologyId: string): Promise<void> {
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

  const response = await fetch(`/api/topologies/${topologyId}`, {
    method: "DELETE",
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `Server error: ${response.status}`);
  }
}

export default deleteTopology;
