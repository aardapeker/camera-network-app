import { getSessionToken } from "./get_session_token";

export type UserSettings = {
  autoSaveEnabled: boolean;
  theme: "dark" | "light" | "system";
  language: "en" | "tr";
  cameraPrefix: string;
  switchPrefix: string;
  nvrPrefix: string;
  routerPrefix: string;
  accessPointPrefix: string;
  upsPrefix: string;
  hornSpeakerPrefix: string;
};

export default async function getSettings(): Promise<UserSettings> {
  const token = getSessionToken();
  if (!token) throw new Error("No authentication token found");

  const response = await fetch("/api/settings/me", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `Server error: ${response.status}`);
  }

  return response.json();
}
