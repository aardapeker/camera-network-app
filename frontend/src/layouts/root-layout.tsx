import type { Route } from "./+types/root-layout";

import React from "react";
import { Outlet, redirect } from "react-router";
import { Header } from "~/components/header";
import { getAuthStatus } from "~/functions/get_auth_status";
import getCurrentUser from "~/functions/get_current_user";
import { enforceServicePortal, isServicePortalHost } from "~/lib/service-portal";
import { CustomPermission } from "~/types";

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const isAuth = await getAuthStatus();

  if (!isAuth.authenticated) {
    throw redirect("/signin");
  }

  const currentUser = await getCurrentUser();

  // On the service-form portal host the app is only the service form, no matter
  // what the user's role would otherwise allow. That allowlist is the whole
  // rule here: the topology-permission restriction below belongs to the main
  // site, and applying it as well would bounce a CUSTOM user who holds no
  // topology permissions - exactly the kind of account created to fill in
  // service forms - back and forth between /home and the form.
  if (isServicePortalHost()) {
    enforceServicePortal(currentUser?.role, new URL(request.url).pathname);

    return {
      currentUser,
      isAdmin: currentUser?.isAdmin,
      isClient: currentUser?.isClient,
    };
  }

  // Clients (and CUSTOM users without any meaningful permissions) can only access /home
  const MEANINGFUL_PERMISSIONS = [
    CustomPermission.CREATE_TOPOLOGY,
    CustomPermission.EDIT_OWN_UNASSIGNED,
    CustomPermission.EDIT_CLIENT_ASSIGNED,
    CustomPermission.VIEW_OWN_UNASSIGNED,
    CustomPermission.VIEW_ALL_TOPOLOGIES,
    CustomPermission.ACCESS_ADMIN_PANEL,
  ];

  const isRestrictedToHome =
    currentUser?.isClient ||
    (currentUser?.role === "ROLE_CUSTOM" &&
      !currentUser.customPermissions?.some((p) => MEANINGFUL_PERMISSIONS.includes(p)));

  if (isRestrictedToHome) {
    const url = new URL(request.url);
    const allowed = ["/home", "/client-topologies"];
    if (!allowed.includes(url.pathname)) {
      throw redirect("/home");
    }
  }

  return {
    currentUser,
    isAdmin: currentUser?.isAdmin,
    isClient: currentUser?.isClient,
  };
}

clientLoader.hydrate = true as const;

function RootLayout({ loaderData, actionData }: Route.ComponentProps) {
  React.useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {loaderData && (
        <Header
          userData={loaderData.currentUser}
          isAdmin={loaderData.currentUser.isAdmin}
        />
      )}
      <main className="flex-1 min-h-0 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}

export default RootLayout;
