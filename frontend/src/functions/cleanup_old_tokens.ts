import { getSessionToken } from "./get_session_token";

type CleanupTokensResponse = {
  message: string;
  deletedCount: number;
};

type CleanupTokensError = {
  message?: string;
  error?: string;
};

export default async function cleanupOldTokens(): Promise<CleanupTokensResponse> {
  const token = getSessionToken();

  if (!token) {
    throw new Error("No authentication token found");
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  // This endpoint can get days parameter. But if there is none it is 30 days by default
  const response = await fetch("/api/admin/tokens/cleanup", {
    method: "POST",
    headers,
  });

  if (!response.ok) {
    const errorData: CleanupTokensError = await response.json().catch(() => ({
      error: `Server error: ${response.status}`,
    }));
    throw new Error(
      errorData.message || errorData.error || `Failed to cleanup tokens: ${response.status}`,
    );
  }

  return await response.json();
}
