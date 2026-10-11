# Service-form portal (servisform.example.com)

Technicians fill in service forms from their own domain instead of signing in to
the main site and finding the form inside the admin panel.

Both hostnames serve the **same** frontend container and the same SPA build. The
app looks at `window.location.hostname` and, on the portal host, reduces itself
to sign-in plus service forms.

## What the portal host exposes

| Path | Page |
| --- | --- |
| `/` | redirects to `/signin` (signed out) or `/form/service` (signed in) |
| `/signin`, `/forgot-password`, `/reset-password` | authentication |
| `/form/service` | the service form - this is the landing page after sign-in |
| `/form/my-forms`, `/form/my-forms/:id` | the technician's own submitted forms |
| `/profile/settings` | account settings |
| anything else | redirects to `/form/service` |

`/signup` and `/verify-user/:email` redirect to `/signin`: technician accounts
are created by an admin in the admin panel.

## Who may sign in there

Every staff role: `ROLE_TECH`, `ROLE_MODERATOR`, `ROLE_CUSTOM`, `ROLE_MANAGER`,
`ROLE_DEVELOPER`, `ROLE_ADMIN`. A `ROLE_CUSTOM` account needs no particular
permission - the granular permissions are about topologies, and an account
created just to fill in service forms holds none of them.

Only `ROLE_CLIENT` is turned away, onto `/portal-access-denied`, which points at
`app.example.com`. The list lives in `PORTAL_BLOCKED_ROLES` in
[`frontend/src/lib/service-portal.ts`](../frontend/src/lib/service-portal.ts).

`/form/my-forms` shows the signed-in user's own forms for everyone, including
admins: it asks for `GET /api/service-forms?mine=true`, so the page matches its
title whoever opens it. Seeing everybody's forms is the admin panel's job, at
`/admin/service-forms` on the main site.

This is a UI boundary, not a security boundary - the backend's role checks are
what actually protect data. Without `?mine=true`, `GET /api/service-forms`
returns only the caller's own forms for `ROLE_TECH` and `ROLE_CLIENT` and
everything to the other roles (`ServiceFormController.isLimitedToOwnForms`).

## Moving parts

- **DNS**: `servisform.example.com` -> the server's IP.
- **Caddy** (`Caddyfile`): a second site block reverse-proxying to `frontend:80`.
  Caddy issues the certificate automatically on first request.
- **nginx** (`frontend/Dockerfile`): unchanged - it answers on any hostname and
  proxies `/auth`, `/users`, `/api`, `/files` to the backend, so the portal is
  same-origin and needs no CORS exception.
- **Backend CORS** (`CorsConfig`): the origin is listed anyway, for direct API
  calls from that origin.
- **PWA**: the portal host serves `public/servisform.webmanifest`, so installing
  it to a phone's home screen gives "FieldDesk Forms" starting at the service form.

## Which hostnames count as the portal

Any hostname whose first label is `servisform` - `servisform.example.com`,
`servisform.localhost`, `servisform.staging.example`. A new one only needs DNS
and a Caddy site block; no code change.

A hostname that does not follow that naming can be added with a comma-separated
`VITE_SERVICE_PORTAL_HOSTS`. It is read at build time and baked into the bundle,
so keep it out of production builds.

## Testing it locally

```bash
cd frontend
npm run dev
```

Then open <http://servisform.localhost:5173> for the portal and
<http://localhost:5173> for the normal app. Browsers resolve `*.localhost` to
the loopback address on their own (no `/etc/hosts` entry needed), and Vite
serves `.localhost` hosts without an `allowedHosts` entry.

The two are separate browser origins, so they have separate `authToken` cookies
- you can stay signed in as an admin on `localhost` and as a technician on
`servisform.localhost` at the same time. Both proxy the API to the same backend,
so the same accounts and data are used.

With the Docker/Podman dev stack (`./dev.sh`), the same URL works as long as the
Vite dev server is the thing listening on 5173.

### Why the dev proxy rewrites Origin

Browsers attach an `Origin` header to POST/PUT/DELETE even when the request is
same-origin. Vite's `changeOrigin: true` rewrites only `Host`, so signing in from
`servisform.localhost:5173` (or from a LAN IP while testing on a phone) reached
the backend with an origin that is not in `CorsConfig` - Spring answered 403 and
the UI showed "Server error: 403". The dev proxy in `frontend/vite.config.ts`
therefore replaces `Origin` with the backend's own origin, which makes it a
same-origin request again.

Production does not need this: nginx and Caddy serve the app and the API under
one hostname, and `https://servisform.example.com` is in `CorsConfig`
anyway. If you add another production portal hostname, add it there too.
