interface SendResetPasswordLinkData {
  email: string;
}

interface SendResetPasswordLinkResponse {
  message: string;
  email: string;
}

async function sendResetPasswordLink(
  data: SendResetPasswordLinkData,
): Promise<SendResetPasswordLinkResponse> {
  const headers = {
    "Content-Type": "application/json",
  };

  const response = await fetch("/auth/sentResetPasswordLink", {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `Server error: ${response.status}`);
  }

  return await response.json();
}

export default sendResetPasswordLink;
