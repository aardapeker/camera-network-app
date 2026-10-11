import type { CustomPermission } from "~/types";
import { getSessionToken } from "./get_session_token";

async function getCustomPermissions(username: string): Promise<CustomPermission[]> {
  const token = getSessionToken();
  if (!token) throw new Error("No authentication token found");

  const response = await fetch(`/api/admin/users/${username}/permissions`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `Server error: ${response.status}`);
  }

  const data: CustomPermission[] = await response.json();
  return data;
}

export default getCustomPermissions;
