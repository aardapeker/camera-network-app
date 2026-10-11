import { getSessionToken } from "../get_session_token";

export type ServiceLocation = "ON_SITE" | "IN_SERVICE" | "REMOTE";
export type ServiceFormStatus =
  | "CONTRACTED"
  | "PAID"
  | "FREE"
  | "TECHNICAL_SUPPORT"
  | "NEW_INSTALLATION";

export type ServiceFormFieldType = "TEXT" | "NUMBER";

export interface ServiceFormFieldValueDto {
  label: string;
  fieldType: ServiceFormFieldType;
  value: string;
}

export interface ServiceFormProductDto {
  productName: string;
  quantity: number;
  fieldValues: ServiceFormFieldValueDto[];
}

export interface SubmitServiceFormPayload {
  customerName: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  serviceDate: string; // ISO date: "YYYY-MM-DD"
  arrivalTime: string; // "HH:mm"
  deliveryTime: string; // "HH:mm"
  notification: string;
  staffCount: number;
  serviceLocation: ServiceLocation;
  serviceStatus: ServiceFormStatus;
  faultDescription: string;
  serviceDescription: string;
  deliveryNotes: string;
  customerSignature: string;
  technicianSignature: string;
  products: ServiceFormProductDto[];
}

export interface ServiceFormResponse {
  id: string;
  customerName: string;
  createdAt: string;
}

export async function submitServiceForm(
  payload: SubmitServiceFormPayload,
): Promise<ServiceFormResponse> {
  const token = getSessionToken();
  if (!token) throw new Error("No authentication token found");

  const response = await fetch("/api/service-forms", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || errorData.error || `Server error: ${response.status}`,
    );
  }

  return await response.json();
}
