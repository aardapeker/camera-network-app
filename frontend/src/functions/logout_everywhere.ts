import { getSessionToken } from "./get_session_token";
import { removeSessionToken } from "./remove_session_token";

interface LogoutEverywhereResponse {
  message: string;
  revokedTokensCount: number;
}

async function logoutEverywhere(): Promise<LogoutEverywhereResponse> {
  const token = getSessionToken();

  if (!token) {
    throw new Error("No authentication token found");
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const response = await fetch("/users/me/logout-everywhere", {
    method: "POST",
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `Server error: ${response.status}`);
  }

  const data: LogoutEverywhereResponse = await response.json();

  removeSessionToken();

  return data;
}

export default logoutEverywhere;
