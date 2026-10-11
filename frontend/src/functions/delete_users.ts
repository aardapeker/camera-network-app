import { getSessionToken } from "./get_session_token";

export default async function deleteUsers(userIds: string | string[]) {
  const token = getSessionToken();

  if (!token) {
    throw new Error("No authentication token found");
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  // Handle single user ID
  const idsArray = Array.isArray(userIds) ? userIds : [userIds];

  const response = await fetch("/api/admin/users/batch-delete", {
    method: "POST",
    headers,
    body: JSON.stringify(idsArray),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `Server error: ${response.status}`);
  }

  return true;
}
