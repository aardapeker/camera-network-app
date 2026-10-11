import { getSessionToken } from "./get_session_token";

export async function getAdminStatus() {
  const token = getSessionToken();

  if (!token) {
    return false;
  }

  try {
    const response = await fetch("/api/admin/isAdmin", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 403) {
      return false;
    }

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json();

    return Boolean(data);
  } catch {
    return false;
  }
}
