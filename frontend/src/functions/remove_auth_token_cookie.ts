// not using instead I am using removeAuthTokenCookie function
export function removeAuthTokenCookie() {
  document.cookie =
    "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}
