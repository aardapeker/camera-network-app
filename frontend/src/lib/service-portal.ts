/**
 * Technician service-form portal (servisform.<your-domain>).
 *
 * The same SPA build is served on both hostnames; which one the browser asked
 * for decides what the app exposes. On the portal host the app is reduced to
 * "sign in -> fill a service form -> look at the forms you submitted", so
 * technicians never have to walk through the admin panel.
 *
 * Hosts that do not follow the servisform.* naming (e.g. plain `localhost`) can
 * be added with VITE_SERVICE_PORTAL_HOSTS as a comma-separated list.
 */
import { redirect } from "react-router";

import { UserRole } from "~/types";

/**
 * Any hostname whose first label is "servisform" is the portal, so
 * servisform.example.com in production and servisform.localhost:5173 in
 * development (browsers resolve *.localhost to the loopback address, and Vite
 * serves .localhost hosts without extra configuration) both work as they are.
 */
const PORTAL_HOST_LABEL = "servisform";

const EXTRA_PORTAL_HOSTS = (import.meta.env.VITE_SERVICE_PORTAL_HOSTS ?? "")
  .split(",")
  .map((host: string) => host.trim().toLowerCase())
  .filter(Boolean);

/** Where an authenticated technician lands on the portal host. */
export const SERVICE_PORTAL_HOME = "/form/service";

/** The technician's own submitted forms. */
export const SERVICE_PORTAL_FORMS = "/form/my-forms";

/** Shown to signed-in users whose role may not use the portal host. */
export const SERVICE_PORTAL_DENIED = "/portal-access-denied";

/**
 * Everything reachable on the portal host once signed in. Anything else
 * redirects to SERVICE_PORTAL_HOME, so the admin panel and the topology tools
 * stay on the main domain even for users whose role allows them there.
 */
const PORTAL_PATHS = [SERVICE_PORTAL_HOME, SERVICE_PORTAL_FORMS, "/profile/settings"];

/**
 * Every staff role may use the portal - technicians, moderators and CUSTOM
 * accounts included, since all of them can be sent out on a service call. Only
 * clients are turned away: they are customers, not staff, and nothing here
 * concerns them.
 */
const PORTAL_BLOCKED_ROLES: string[] = [UserRole.CLIENT];

export function isServicePortalHost(): boolean {
  if (typeof window === "undefined") return false;

  const hostname = window.location.hostname.toLowerCase();
  return (
    hostname === PORTAL_HOST_LABEL ||
    hostname.startsWith(`${PORTAL_HOST_LABEL}.`) ||
    EXTRA_PORTAL_HOSTS.includes(hostname)
  );
}

export function isServicePortalPath(pathname: string): boolean {
  return PORTAL_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function canUseServicePortal(role: string | undefined): boolean {
  return !!role && !PORTAL_BLOCKED_ROLES.includes(role);
}

/**
 * Post-login landing page: the service form on the portal host, the usual
 * dashboard everywhere else.
 */
export function landingPath(): string {
  return isServicePortalHost() ? SERVICE_PORTAL_HOME : "/home";
}

/**
 * Guard for every layout reachable on the portal host: wrong role goes to the
 * "use the main site" page, anything outside the portal goes to the form.
 * No-op on the main host. Throws a redirect, so call it from a clientLoader.
 */
export function enforceServicePortal(
  role: string | undefined,
  pathname: string,
): void {
  if (!isServicePortalHost()) return;

  if (!canUseServicePortal(role)) {
    if (pathname !== SERVICE_PORTAL_DENIED) throw redirect(SERVICE_PORTAL_DENIED);
    return;
  }

  if (!isServicePortalPath(pathname)) throw redirect(SERVICE_PORTAL_HOME);
}
