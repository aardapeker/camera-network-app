import { getSessionToken } from "./get_session_token";

type CleanupTokensResponse = {
  message: string;
  deletedCount: number;
};

type CleanupTokensError = {
  message?: string;
  error?: string;
};

export default async function cleanupAllTokens(): Promise<CleanupTokensResponse> {
  const token = getSessionToken();

  if (!token) {
    throw new Error("No authentication token found");
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const response = await fetch("/api/admin/tokens/cleanup/all", {
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
