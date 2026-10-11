import { getSessionToken } from "./get_session_token";

export default async function updateUserRole(username: string, role: string): Promise<void> {
  const token = getSessionToken();
  if (!token) throw new Error("No authentication token found");

  const response = await fetch(`/api/admin/users/${encodeURIComponent(username)}/role`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ role }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `Server error: ${response.status}`);
  }
}
