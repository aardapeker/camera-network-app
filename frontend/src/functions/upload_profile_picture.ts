import { getSessionToken } from "./get_session_token";

interface UploadProfilePictureResponse {
  message: string;
  username: string;
  profilePictureUrl: string;
  fileName: string;
  fileSize: number;
  contentType: string;
}

async function uploadProfilePicture(
  profilePicture: File,
): Promise<UploadProfilePictureResponse> {
  const token = getSessionToken();

  if (!token) {
    throw new Error("No authentication token found");
  }

  if (!profilePicture) {
    throw new Error("No file provided");
  }

  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  if (!allowedTypes.includes(profilePicture.type)) {
    throw new Error(
      "Invalid file type. Please upload an image (JPEG, PNG, GIF, or WebP)",
    );
  }

  const maxSize = 5 * 1024 * 1024; // 5MB
  if (profilePicture.size > maxSize) {
    throw new Error("File size too large. Maximum size is 5MB");
  }

  const formData = new FormData();
  formData.append("file", profilePicture);

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  const response = await fetch("/files/upload", {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `Server error: ${response.status}`);
  }

  return await response.json();
}

export default uploadProfilePicture;
