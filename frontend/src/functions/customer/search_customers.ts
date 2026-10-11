import { getSessionToken } from "../get_session_token";

/** One directory entry: a customer at one of its addresses. */
export interface CustomerSiteDto {
  id: string;
  /** Combobox display label, e.g. "Barsan Global Lojistik — Samandıra". */
  name: string;
  customerId: string;
  customerName: string;
  siteLabel: string | null;
  address: string | null;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
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

export async function searchCustomers(
  query: string,
  signal?: AbortSignal,
): Promise<CustomerSiteDto[]> {
  const response = await fetch(
    `/api/customers?query=${encodeURIComponent(query)}`,
    { headers: authHeaders(), signal },
  );
  return handle(response);
}

export async function quickAddCustomer(input: {
  customerName: string;
  siteLabel?: string;
  address?: string;
  contactPerson?: string;
  phone?: string;
}): Promise<CustomerSiteDto> {
  const response = await fetch("/api/customers", {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify(input),
  });
  return handle(response);
}
