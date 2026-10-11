import { Outlet, redirect } from "react-router";

import { getAuthStatus } from "~/functions/get_auth_status";
import { isServicePortalHost, landingPath } from "~/lib/service-portal";
import type { Route } from "./+types/auth-layout";

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const isAuth = await getAuthStatus();

  // If user is already authenticated then redirect them to the landing page
  // for this host (the service form on the portal host, /home otherwise).
  if (isAuth.authenticated) {
    return redirect(landingPath());
  }

  // Technician accounts are created by an admin, so the portal host offers
  // sign-in only.
  if (isServicePortalHost()) {
    const { pathname } = new URL(request.url);
    if (pathname === "/signup" || pathname.startsWith("/verify-user")) {
      return redirect("/signin");
    }
  }

  return null;
}

clientLoader.hydrate = true as const;

function AuthLayout() {
  return (
    <>
      <Outlet />
    </>
  );
}

export default AuthLayout;
