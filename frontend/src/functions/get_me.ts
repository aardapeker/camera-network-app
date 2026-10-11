import type { CurrentUserType } from "~/types.ts";
import { getSessionToken } from "~/functions/get_session_token";

async function getMe() {
  const token = getSessionToken();

  if (!token) {
    throw new Error("No authentication token found");
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const response = await fetch("/users/me", {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `Server error: ${response.status}`);
  }

  const data: CurrentUserType = await response.json();
  return data;
}

export default getMe;
