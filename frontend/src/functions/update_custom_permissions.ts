import type { CustomPermission } from "~/types";
import { getSessionToken } from "./get_session_token";

async function updateCustomPermissions(username: string, permissions: CustomPermission[]): Promise<void> {
  const token = getSessionToken();
  if (!token) throw new Error("No authentication token found");

  const response = await fetch(`/api/admin/users/${username}/permissions`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(permissions),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `Server error: ${response.status}`);
  }
}

export default updateCustomPermissions;
