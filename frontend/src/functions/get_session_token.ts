export function getSessionToken() {
  const cookieString = document.cookie;
  const cookies = cookieString.split("; ");
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].split("=");
    if (cookie[0] === "authToken") {
      return cookie[1];
    }
  }
  return null; // Return null if the session ID cookie is not found
}
