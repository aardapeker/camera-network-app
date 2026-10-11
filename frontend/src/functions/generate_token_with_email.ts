import { setAuthTokenCookie } from "./set_auth_token_cookie";

interface LoginData {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  message: string;
}

interface ApiError {
  message: string;
  details?: Record<string, string>;
}

async function generateTokenWithEmail(userData: LoginData): Promise<string> {
  const headers = {
    "Content-Type": "application/json",
  };

  const response = await fetch("/auth/login", {
    method: "POST",
    headers,
    body: JSON.stringify({
      identifier: userData.email,
      password: userData.password,
    }),
  });

  if (!response.ok) {
    const errorData: ApiError = await response.json().catch(() => ({
      message: `Server error: ${response.status}`,
    }));
    throw new Error(errorData.message || `Authentication failed`);
  }

  const data: LoginResponse = await response.json();

  setAuthTokenCookie(data.token);

  return data.token;
}

export default generateTokenWithEmail;
