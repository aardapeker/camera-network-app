import { getSessionToken } from "~/functions/get_session_token";
import type { LoginAttemptsResponse } from "~/types";

type GetAllLoginAttemptsParams = {
  page?: string;
  size?: string;
  sortBy?: string;
  sortDirection?: string;
};

async function getAllLoginAttempts(
  _params: GetAllLoginAttemptsParams = {},
): Promise<LoginAttemptsResponse> {
  const { page, size, sortBy, sortDirection } = _params;

  const token = getSessionToken();

  if (!token) {
    throw new Error("No authentication token found");
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  // Build query params
  const params = new URLSearchParams();

  if (page) params.append("page", page);
  params.append("size", size ?? "10000");

  if (sortBy) params.append("sortBy", sortBy);
  if (sortDirection) params.append("sortDirection", sortDirection);

  const response = await fetch(`/api/admin/login-attempts?${params}`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `Server error: ${response.status}`);
  }

  const data: LoginAttemptsResponse = await response.json();

  return data;
}

export default getAllLoginAttempts;
