import { getSessionToken } from "../get_session_token";
import type { ComponentFieldDto, ComponentFieldType } from "../component/search_components";
import type { CustomerSiteDto } from "../customer/search_customers";

export interface ServiceFormTemplateComponentDto {
  id: string;
  componentId: string;
  componentName: string;
  defaultQuantity: number;
  fields: ComponentFieldDto[];
}

export interface ServiceFormTemplateDto {
  id: string;
  nameTr: string;
  nameEn: string;
  promptHint: string | null;
  faultExample: string | null;
  serviceExample: string | null;
  active: boolean;
  orderIndex: number;
  suggestedComponents: ServiceFormTemplateComponentDto[];
}

/** A component field with whatever brand/model the technician dictated already filled in. */
export interface TemplateDraftFieldValueDto {
  label: string;
  fieldType: ComponentFieldType;
  value: string;
}

export interface TemplateDraftProductDto {
  /** Null when the material is not in the catalogue - it stays a plain row. */
  componentId: string | null;
  productName: string;
  quantity: number;
  fields: TemplateDraftFieldValueDto[];
}

export interface TemplateDraftDto {
  faultDescription: string;
  serviceDescription: string;
  deliveryNotes: string;
  products: TemplateDraftProductDto[];
  /** Resolved from the customer directory when one was named, otherwise null. */
  customer: CustomerSiteDto | null;
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

/** Localized template name for the active UI language. */
export function templateName(
  template: ServiceFormTemplateDto,
  language: string,
): string {
  return language.toLowerCase().startsWith("tr")
    ? template.nameTr
    : template.nameEn;
}

export async function getServiceFormTemplates(): Promise<ServiceFormTemplateDto[]> {
  const response = await fetch("/api/service-form-templates", {
    headers: authHeaders(),
  });
  return handle(response);
}

export async function draftFromTemplate(input: {
  templateId: string;
  notes: string;
  language?: string;
  customerName?: string;
  serviceDate?: string;
}): Promise<TemplateDraftDto> {
  const response = await fetch("/api/service-form-templates/draft", {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify(input),
  });
  return handle(response);
}
