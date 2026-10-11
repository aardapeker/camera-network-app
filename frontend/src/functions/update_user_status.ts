import type { UserStatus } from "~/types";
import { getSessionToken } from "./get_session_token";

export type UpdateUserStatusResponse = {
  message: string;
  userId: string;
  status: UserStatus;
};

type ApiError = {
  message: string;
  details?: Record<string, string>;
};

export async function updateUserStatus(
  userId: string,
  status: UserStatus,
): Promise<UpdateUserStatusResponse> {
  const token = getSessionToken();

  if (!token) {
    throw new Error("No authentication token found");
  }

  const response = await fetch(`/api/admin/users/${userId}/status`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const errorData: ApiError = await response.json().catch(() => ({
      message: `Server error: ${response.status}`,
    }));
    throw new Error(errorData.message || `Failed to update user status`);
  }

  return response.json();
}
