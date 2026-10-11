import { getSessionToken } from "~/functions/get_session_token";
import type { LoginAttempt } from "~/types";

async function getMyLoginAttempts() {
  const token = getSessionToken();

  if (!token) {
    throw new Error("No authentication token found");
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const response = await fetch("/users/me/login-attempts", {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `Server error: ${response.status}`);
  }

  const data: LoginAttempt[] = await response.json();

  return data;
}

export default getMyLoginAttempts;
