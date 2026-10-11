import { getSessionToken } from "./get_session_token";
import { removeSessionToken } from "./remove_session_token";

export default async function logUserOut(): Promise<boolean> {
  const token = getSessionToken();

  if (!token) {
    return removeSessionToken();
  }

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  try {
    const response = await fetch("/users/me/logout", {
      method: "POST",
      headers,
    });

    // Even if backend fails, still clear local token
    const localCleared = removeSessionToken();

    if (!response.ok) {
      // Return true if local token was cleared, even if backend failed
      return localCleared;
    }

    // No response body expected, just return null
    return removeSessionToken();
  } catch {
    // Still try to clear local token even if network fails
    return removeSessionToken();
  }
}
