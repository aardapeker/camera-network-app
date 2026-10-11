import { getSessionToken } from "../get_session_token";

export type ComponentFieldType = "TEXT" | "NUMBER";

export interface ComponentFieldDto {
  id: string;
  label: string;
  fieldType: ComponentFieldType;
  orderIndex: number;
}

export interface ComponentDto {
  id: string;
  name: string;
  fields: ComponentFieldDto[];
}

export async function searchComponents(
  query: string,
  signal?: AbortSignal,
): Promise<ComponentDto[]> {
  const token = getSessionToken();
  if (!token) throw new Error("No authentication token found");

  const response = await fetch(
    `/api/components?query=${encodeURIComponent(query)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || errorData.error || `Server error: ${response.status}`,
    );
  }

  return await response.json();
}
