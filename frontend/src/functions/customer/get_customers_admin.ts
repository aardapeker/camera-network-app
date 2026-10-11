import { getSessionToken } from "../get_session_token";
import type { CustomerSiteDto } from "./search_customers";

export interface CustomerAdmin {
  id: string;
  name: string;
  shortName: string | null;
  sites: CustomerSiteDto[];
}

export interface SaveCustomerSiteInput {
  label: string;
  address?: string | null;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
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

const BASE = "/api/admin/customers";

export async function getCustomersAdmin(): Promise<CustomerAdmin[]> {
  return handle(await fetch(BASE, { headers: authHeaders() }));
}

export async function createCustomerAdmin(
  name: string,
  shortName?: string,
): Promise<CustomerAdmin> {
  return handle(
    await fetch(BASE, {
      method: "POST",
      headers: authHeaders(true),
      body: JSON.stringify({ name, shortName }),
    }),
  );
}

export async function updateCustomerAdmin(
  id: string,
  name: string,
  shortName?: string | null,
): Promise<CustomerAdmin> {
  return handle(
    await fetch(`${BASE}/${id}`, {
      method: "PUT",
      headers: authHeaders(true),
      body: JSON.stringify({ name, shortName }),
    }),
  );
}

export async function deleteCustomerAdmin(id: string): Promise<void> {
  return handle(
    await fetch(`${BASE}/${id}`, { method: "DELETE", headers: authHeaders() }),
  );
}

export async function addCustomerSite(
  customerId: string,
  input: SaveCustomerSiteInput,
): Promise<CustomerSiteDto> {
  return handle(
    await fetch(`${BASE}/${customerId}/sites`, {
      method: "POST",
      headers: authHeaders(true),
      body: JSON.stringify(input),
    }),
  );
}

export async function updateCustomerSite(
  customerId: string,
  siteId: string,
  input: SaveCustomerSiteInput,
): Promise<CustomerSiteDto> {
  return handle(
    await fetch(`${BASE}/${customerId}/sites/${siteId}`, {
      method: "PUT",
      headers: authHeaders(true),
      body: JSON.stringify(input),
    }),
  );
}

export async function deleteCustomerSite(
  customerId: string,
  siteId: string,
): Promise<void> {
  return handle(
    await fetch(`${BASE}/${customerId}/sites/${siteId}`, {
      method: "DELETE",
      headers: authHeaders(),
    }),
  );
}
