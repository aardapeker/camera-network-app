import { getSessionToken } from "../get_session_token";
import type {
  ServiceFormTemplateDto,
  ServiceFormTemplateComponentDto,
} from "./get_service_form_templates";

export interface SaveServiceFormTemplateInput {
  nameTr: string;
  nameEn: string;
  promptHint?: string | null;
  faultExample?: string | null;
  serviceExample?: string | null;
  active?: boolean;
  orderIndex?: number;
}

function authHeaders(json = false): HeadersInit {
  const token = getSessionToken();
  if (!token) throw new Error("No authentication token found");
  return json
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { Authorization: `Bearer ${token}` };
}

async function handle<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || errorData.error || `Server error: ${response.status}`,
    );
  }
  return response.status === 204 ? (undefined as T) : await response.json();
}

const BASE = "/api/admin/service-form-templates";

export async function getTemplatesAdmin(): Promise<ServiceFormTemplateDto[]> {
  return handle(await fetch(BASE, { headers: authHeaders() }));
}

export async function createTemplateAdmin(
  input: SaveServiceFormTemplateInput,
): Promise<ServiceFormTemplateDto> {
  return handle(
    await fetch(BASE, {
      method: "POST",
      headers: authHeaders(true),
      body: JSON.stringify(input),
    }),
  );
}

export async function updateTemplateAdmin(
  id: string,
  input: SaveServiceFormTemplateInput,
): Promise<ServiceFormTemplateDto> {
  return handle(
    await fetch(`${BASE}/${id}`, {
      method: "PUT",
      headers: authHeaders(true),
      body: JSON.stringify(input),
    }),
  );
}

export async function deleteTemplateAdmin(id: string): Promise<void> {
  return handle(
    await fetch(`${BASE}/${id}`, { method: "DELETE", headers: authHeaders() }),
  );
}

export async function addTemplateComponent(
  templateId: string,
  componentName: string,
  defaultQuantity = 1,
): Promise<ServiceFormTemplateComponentDto> {
  return handle(
    await fetch(`${BASE}/${templateId}/components`, {
      method: "POST",
      headers: authHeaders(true),
      body: JSON.stringify({ componentName, defaultQuantity }),
    }),
  );
}

export async function removeTemplateComponent(
  templateId: string,
  templateComponentId: string,
): Promise<void> {
  return handle(
    await fetch(`${BASE}/${templateId}/components/${templateComponentId}`, {
      method: "DELETE",
      headers: authHeaders(),
    }),
  );
}
