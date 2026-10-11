import { getSessionToken } from "../get_session_token";
import type { ComponentDto } from "./search_components";

export async function createComponent(name: string): Promise<ComponentDto> {
  const token = getSessionToken();
  if (!token) throw new Error("No authentication token found");

  const response = await fetch("/api/components", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || errorData.error || `Server error: ${response.status}`,
    );
  }

  return await response.json();
}
