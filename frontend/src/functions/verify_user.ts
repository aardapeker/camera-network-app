interface VerifyUserData {
  email: string;
  verificationCode: string;
}

interface VerifyUserResponse {
  token: string;
  message: string;
  username: string;
  email: string;
}

async function verifyUser(
  verifyUserData: VerifyUserData,
): Promise<VerifyUserResponse> {
  const headers = {
    "Content-Type": "application/json",
  };

  const response = await fetch("/auth/verify", {
    method: "POST",
    headers,
    body: JSON.stringify(verifyUserData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `Server error: ${response.status}`);
  }

  return await response.json();
}

export default verifyUser;
