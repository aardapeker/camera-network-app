// not using instead I am using the get_me function
// DELETE WHEN YOU ARE REFACTORING
import { redirect } from "react-router";
import type { CurrentUserType } from "~/types.ts";
import { getSessionToken } from "~/functions/get_session_token";
import { removeSessionToken } from "~/functions/remove_session_token";

async function getCurrentUser() {
  const token = getSessionToken();

  if (!token) {
    throw redirect("/signin");
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const response = await fetch("/users/me", {
    method: "GET",
    headers,
  });

  if (response.status === 401) {
    removeSessionToken();
    throw redirect("/signin");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `Server error: ${response.status}`);
  }

  const data: CurrentUserType = await response.json();
  return data;
}

export default getCurrentUser;
