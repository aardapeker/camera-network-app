import { getSessionToken } from "./get_session_token";

type UserData = {
  [k: string]: FormDataEntryValue;
};

export default async function updateUserPassword(userData: UserData) {
  const token = getSessionToken();

  if (!token) {
    throw new Error("No authentication token found");
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const response = await fetch("/users/me/change-password", {
    method: "PUT",
    headers,
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(
      errorData.message || `Server error: ${response.status}`,
    ) as Error & {
      details?: Record<string, string>;
    };
    error.details = errorData.details;
    throw error;
  }

  return await response.json();
}
