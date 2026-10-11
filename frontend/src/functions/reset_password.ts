interface ResetPasswordData {
  token: string;
  email: string;
  password: string;
}

interface ResetPasswordResponse {
  message: string;
}

async function resetPassword(
  data: ResetPasswordData,
): Promise<ResetPasswordResponse> {
  const headers = {
    "Content-Type": "application/json",
  };

  const response = await fetch("/auth/reset-password", {
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

export default resetPassword;
