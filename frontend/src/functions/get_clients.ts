import type { User } from "~/types";
import { getSessionToken } from "./get_session_token";

async function getClients(): Promise<User[]> {
  const token = getSessionToken();

  if (!token) {
    throw new Error("No authentication token found");
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const response = await fetch(`/api/topologies/clients`, {
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `Server error: ${response.status}`);
  }

  const data: User[] = await response.json();
  return data;
}

export default getClients;
