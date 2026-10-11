import { getSessionToken } from "~/functions/get_session_token";

export async function getAuthStatus(): Promise<{ authenticated: boolean }> {
  const token = getSessionToken();

  if (!token) {
    return { authenticated: false };
  }

  try {
    const response = await fetch("/users/me/isAuthenticated", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 403) {
      return { authenticated: false };
    }

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json();
    return data;
  } catch {
    return { authenticated: false };
  }
}
