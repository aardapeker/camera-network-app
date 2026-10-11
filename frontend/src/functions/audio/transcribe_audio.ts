import { getSessionToken } from "../get_session_token";

export interface TranscriptionResponse {
  text: string;
}

export async function transcribeAudio(
  audioBlob: Blob,
  language?: string,
): Promise<string> {
  const token = getSessionToken();
  if (!token) throw new Error("No authentication token found");

  const formData = new FormData();
  const extension = audioBlob.type.includes("mp4") ? "mp4" : "webm";
  formData.append("file", audioBlob, `recording.${extension}`);
  if (language) formData.append("language", language);

  const response = await fetch("/api/audio/transcribe", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || errorData.error || `Server error: ${response.status}`,
    );
  }

  const data: TranscriptionResponse = await response.json();
  return data.text;
}
