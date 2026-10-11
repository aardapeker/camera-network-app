import { getSessionToken } from "~/functions/get_session_token";
import type { UserActivityStats } from "~/components/analytics/user-activity-leaderboard";

async function getMostActiveUsers(size = 10): Promise<UserActivityStats[]> {
  const token = getSessionToken();
  if (!token) return [];

  try {
    const params = new URLSearchParams({ page: "0", size: String(size) });
    const response = await fetch(`/api/admin/users/most-active?${params}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) return [];

    const data = await response.json();
    // Backend returns a paginated response or plain array
    return Array.isArray(data) ? data : (data.content ?? []);
  } catch {
    return [];
  }
}

export default getMostActiveUsers;
