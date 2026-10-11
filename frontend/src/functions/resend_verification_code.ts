interface ResendCodeData {
  email: string;
}

interface ResendCodeResponse {
  message: string;
  email: string;
}

async function resendVerificationCode(
  data: ResendCodeData,
): Promise<ResendCodeResponse> {
  const headers = {
    "Content-Type": "application/json",
  };

  const response = await fetch("/auth/resend-verification-code", {
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

export default resendVerificationCode;
