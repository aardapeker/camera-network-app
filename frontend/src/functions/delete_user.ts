// Not using anymore delete when refactoring. (I handle it with delete_users function)
import { getSessionToken } from "./get_session_token";

interface DeleteUserParams {
  userId: string;
}

async function deleteUser({ userId }: DeleteUserParams): Promise<string> {
  const token = getSessionToken();

  if (!token) {
    throw new Error("No authentication token found");
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const response = await fetch(`/api/admin/users/${userId}`, {
    method: "DELETE",
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `Server error: ${response.status}`);
  }

  return await response.text();
}

export default deleteUser;
