export function removeSessionToken(): boolean {
  try {
    // Remove the authToken cookie by setting it to expire in the past
    document.cookie =
      "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

    // Fallback: Try with domain as well
    const domain = window.location.hostname;
    document.cookie = `authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain};`;

    // Also try without domain (for localhost)
    document.cookie =
      "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=;";

    // Verify the cookie was removed
    const stillExists = document.cookie
      .split("; ")
      .some((cookie) => cookie.startsWith("authToken="));

    return !stillExists;
  } catch {
    return false;
  }
}
