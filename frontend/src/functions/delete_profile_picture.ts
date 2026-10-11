import { getSessionToken } from "./get_session_token";

interface DeleteProfilePictureResponse {
  message: string;
  username: string;
  fileName: string;
  path: string;
}

async function deleteProfilePicture(
  fileName: string,
): Promise<DeleteProfilePictureResponse> {
  const token = getSessionToken();

  if (!token) {
    throw new Error("No authentication token found");
  }

  if (!fileName || fileName.trim() === "") {
    throw new Error("File name is required");
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const response = await fetch("/files/delete", {
    method: "DELETE",
    headers,
    body: JSON.stringify({ fileName }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `Server error: ${response.status}`);
  }

  return await response.json();
}

export default deleteProfilePicture;
