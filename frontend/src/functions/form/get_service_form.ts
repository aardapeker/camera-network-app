import { getSessionToken } from "../get_session_token";

export interface ServiceFormDetail {
  id: string;
  customerName: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  serviceDate: string;
  arrivalTime: string;
  deliveryTime: string;
  notification: string;
  staffCount: number;
  serviceLocation: string;
  serviceStatus: string;
  faultDescription: string;
  serviceDescription: string;
  deliveryNotes: string;
  customerSignature: string;
  technicianSignature: string;
  syncStatus: string;
  technicianUsername: string;
  createdAt: string;
  updatedAt: string;
  products: {
    id: string;
    productName: string;
    quantity: number;
    fieldValues: {
      label: string;
      fieldType: "TEXT" | "NUMBER";
      value: string;
    }[];
  }[];
}

export async function getServiceForm(id: string): Promise<ServiceFormDetail> {
  const token = getSessionToken();
  if (!token) throw new Error("No authentication token found");

  const response = await fetch(`/api/service-forms/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `Server error: ${response.status}`);
  }

  return await response.json();
}
