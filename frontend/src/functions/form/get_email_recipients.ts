import { getSessionToken } from "../get_session_token";

export interface EmailRecipient {
  id: string;
  email: string;
  label: string;
  active: boolean;
  createdAt: string;
}

export async function getEmailRecipients(): Promise<EmailRecipient[]> {
  const token = getSessionToken();
  if (!token) throw new Error("No authentication token found");

  const response = await fetch("/api/admin/email-recipients", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `Server error: ${response.status}`);
  }

  return await response.json();
}

export async function addEmailRecipient(email: string, label: string): Promise<EmailRecipient> {
  const token = getSessionToken();
  if (!token) throw new Error("No authentication token found");

  const response = await fetch("/api/admin/email-recipients", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email, label }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `Server error: ${response.status}`);
  }

  return await response.json();
}

export async function toggleEmailRecipient(id: string): Promise<EmailRecipient> {
  const token = getSessionToken();
  if (!token) throw new Error("No authentication token found");

  const response = await fetch(`/api/admin/email-recipients/${id}/toggle`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `Server error: ${response.status}`);
  }

  return await response.json();
}

export async function deleteEmailRecipient(id: string): Promise<void> {
  const token = getSessionToken();
  if (!token) throw new Error("No authentication token found");

  const response = await fetch(`/api/admin/email-recipients/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `Server error: ${response.status}`);
  }
}
