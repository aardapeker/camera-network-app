import { getSessionToken } from "./get_session_token";

interface UploadBlueprintPictureResponse {
  message: string;
  username: string;
  blueprintPictureUrl: string;
  fileName: string;
  fileSize: number;
  contentType: string;
}

async function uploadBlueprintPicture(
  blueprintPicture: File,
  clientUsername: string,
): Promise<UploadBlueprintPictureResponse> {
  const token = getSessionToken();

  if (!token) {
    throw new Error("No authentication token found");
  }

  if (!blueprintPicture) {
    throw new Error("No file provided");
  }

  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  if (!allowedTypes.includes(blueprintPicture.type)) {
    throw new Error(
      "Invalid file type. Please upload an image (JPEG, PNG, GIF, or WebP)",
    );
  }

  const maxSize = 50 * 1024 * 1024; // 50MB
  if (blueprintPicture.size > maxSize) {
    throw new Error("File size too large. Maximum size is 50MB");
  }

  const formData = new FormData();
  formData.append("file", blueprintPicture);
  if (clientUsername) {
    formData.append("clientUsername", clientUsername);
  }

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  const response = await fetch("/files/upload-blueprint", {
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

export default uploadBlueprintPicture;
