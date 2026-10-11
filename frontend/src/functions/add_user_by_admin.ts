import { getSessionToken } from "./get_session_token";

type Role =
  | "ROLE_ADMIN"
  | "ROLE_DEVELOPER"
  | "ROLE_MANAGER"
  | "ROLE_MODERATOR"
  | "ROLE_TECH"
  | "ROLE_CLIENT"
  | "ROLE_CUSTOM";

interface AddUserByAdminData {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  profilePictureUrl?: string;
  authorities: Role[];
}

interface AddUserByAdminResponse {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  message: string;
}

async function addUserByAdmin(
  userData: AddUserByAdminData,
): Promise<AddUserByAdminResponse> {
  const token = getSessionToken();

  if (!token) {
    throw new Error("No authentication token found");
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const response = await fetch("/api/admin/users", {
    method: "POST",
    headers,
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `Server error: ${response.status}`);
  }

  return await response.json();
}

export default addUserByAdmin;
