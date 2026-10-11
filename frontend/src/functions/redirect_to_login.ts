import { redirect } from "react-router";
import { getAuthStatus } from "./get_auth_status";

export async function redirectToLogin(): Promise<string> {
  const isAuthenticated = await getAuthStatus();

  if (!isAuthenticated.authenticated) {
    throw redirect("/signin");
  }

  return "User is authenticated";
}
