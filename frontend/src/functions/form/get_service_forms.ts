import { getSessionToken } from "../get_session_token";

export interface ServiceFormListItem {
  id: string;
  customerName: string;
  contactPerson: string;
  phone: string;
  email: string;
  serviceDate: string;
  arrivalTime: string;
  serviceLocation: string;
  serviceStatus: string;
  technicianUsername: string;
  syncStatus: string;
  createdAt: string;
}

/**
 * @param options.mine only the forms the signed-in user filled in themselves.
 *   The admin panel's list leaves this off and gets everything it is allowed to
 *   see; the technician's own list always asks for it.
 */
export async function getServiceForms(
  options: { mine?: boolean } = {},
): Promise<ServiceFormListItem[]> {
  const token = getSessionToken();
  if (!token) throw new Error("No authentication token found");

  const query = options.mine ? "?mine=true" : "";

  const response = await fetch(`/api/service-forms${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `Server error: ${response.status}`);
  }

  return await response.json();
}
