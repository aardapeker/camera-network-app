import { getSessionToken } from "../get_session_token";

export type ComponentFieldType = "TEXT" | "NUMBER";

export interface ComponentFieldAdmin {
  id: string;
  label: string;
  fieldType: ComponentFieldType;
  orderIndex: number;
}

export interface ComponentAdmin {
  id: string;
  name: string;
  fields: ComponentFieldAdmin[];
}

async function handle<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `Server error: ${response.status}`);
  }
  return response.status === 204 ? (undefined as T) : await response.json();
}

function authHeaders(json = false): HeadersInit {
  const token = getSessionToken();
  if (!token) throw new Error("No authentication token found");
  return json
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { Authorization: `Bearer ${token}` };
}

export async function getComponentsAdmin(): Promise<ComponentAdmin[]> {
  const response = await fetch("/api/admin/components", { headers: authHeaders() });
  return handle(response);
}

export async function createComponentAdmin(name: string): Promise<ComponentAdmin> {
  const response = await fetch("/api/admin/components", {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify({ name }),
  });
  return handle(response);
}

export async function renameComponentAdmin(id: string, name: string): Promise<ComponentAdmin> {
  const response = await fetch(`/api/admin/components/${id}`, {
    method: "PATCH",
    headers: authHeaders(true),
    body: JSON.stringify({ name }),
  });
  return handle(response);
}

export async function deleteComponentAdmin(id: string): Promise<void> {
  const response = await fetch(`/api/admin/components/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handle(response);
}

export async function addComponentField(
  componentId: string,
  label: string,
  fieldType: ComponentFieldType,
): Promise<ComponentFieldAdmin> {
  const response = await fetch(`/api/admin/components/${componentId}/fields`, {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify({ label, fieldType }),
  });
  return handle(response);
}

export async function updateComponentField(
  componentId: string,
  fieldId: string,
  label: string,
  fieldType: ComponentFieldType,
): Promise<ComponentFieldAdmin> {
  const response = await fetch(`/api/admin/components/${componentId}/fields/${fieldId}`, {
    method: "PATCH",
    headers: authHeaders(true),
    body: JSON.stringify({ label, fieldType }),
  });
  return handle(response);
}

export async function deleteComponentField(componentId: string, fieldId: string): Promise<void> {
  const response = await fetch(`/api/admin/components/${componentId}/fields/${fieldId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handle(response);
}
