import { getSessionToken } from "./get_session_token";
import type { UserSettings } from "./get_settings";

export default async function updateSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
  const token = getSessionToken();
  if (!token) throw new Error("No authentication token found");

  const response = await fetch("/api/settings/me", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(settings),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `Server error: ${response.status}`);
  }

  return response.json();
}
