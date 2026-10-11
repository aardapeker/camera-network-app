import { getSessionToken } from "./get_session_token";

type UserData = {
  [k: string]: FormDataEntryValue;
};

export default async function updateUserDetails(userData: UserData) {
  const token = getSessionToken();

  if (!token) {
    throw new Error("No authentication token found");
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const response = await fetch("/users/me/change-details", {
    method: "PUT",
    headers,
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `Server error: ${response.status}`);
  }

  return await response.json();
}
