import { getSessionToken } from "./get_session_token";

export interface PdfExtractedItem {
  index: number;
  type: "page" | "embedded";
  label: string;
  thumbnailUrl: string;
  width: number;
  height: number;
}

export interface PdfUploadResponse {
  sessionId: string;
  expiresAt: string;
}

export interface PdfStatusResponse {
  status: "PENDING" | "EXTRACTING" | "DONE" | "FAILED";
  progressCurrent: number;
  progressTotal: number;
  error?: string;
  items?: PdfExtractedItem[];
}

export interface PdfConfirmResponse {
  blueprintUrls: string[];
}

function authHeaders() {
  const token = getSessionToken();
  if (!token) throw new Error("No authentication token found");
  return { Authorization: `Bearer ${token}` };
}

export async function uploadPdf(file: File): Promise<PdfUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/files/pdf/upload", {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || err.error || `Upload failed: ${response.status}`);
  }

  return response.json();
}

export async function pollPdfStatus(sessionId: string): Promise<PdfStatusResponse> {
  const response = await fetch(`/files/pdf/${sessionId}/status`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || err.error || `Status check failed: ${response.status}`);
  }

  return response.json();
}

export async function confirmPdfSelection(
  sessionId: string,
  selectedIndices: number[],
  names: string[],
  clientUsername: string,
): Promise<PdfConfirmResponse> {
  const response = await fetch(`/files/pdf/${sessionId}/confirm`, {
    method: "POST",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ selectedIndices, names, clientUsername }),
  });

  if (response.status === 404 || response.status === 410) {
    throw new Error("SESSION_EXPIRED");
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || err.error || `Confirm failed: ${response.status}`);
  }

  return response.json();
}
