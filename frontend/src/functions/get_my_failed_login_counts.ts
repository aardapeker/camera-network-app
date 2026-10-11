import { getSessionToken } from "~/functions/get_session_token";
import type { LoginAttempt } from "~/types";

async function getMyFailedLoginCounts(minutes: string | null) {
  const token = getSessionToken();

  if (!token) {
    throw new Error("No authentication token found");
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  // Build query params
  const params = new URLSearchParams();

  if (minutes) params.append("minutes", minutes);

  const response = await fetch(
    `/users/me/login-attempts/failed-count?${params}`,
    {
      method: "GET",
      headers,
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `Server error: ${response.status}`);
  }

  const data: LoginAttempt[] = await response.json();

  return data;
}

export default getMyFailedLoginCounts;
