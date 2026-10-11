# Testing Backend Endpoints with curl

Reference for testing/debugging backend endpoints directly from a terminal,
without going through the browser. **You never need any of this for normal
use of the app** — logging into the website handles authentication
automatically. This is purely for manual verification (e.g. checking an
endpoint after a deploy, confirming the Pi's data landed correctly).

---

## 1. There Are Two Separate Auth Mechanisms

| | Who uses it | How it works | Scope |
|---|---|---|---|
| **JWT** | You, logged into the admin website | Login once, get a token, browser attaches it to every request automatically | Full admin access, tied to your user account and role |
| **API key** (`X-API-Key` header) | The Raspberry Pi agents | A static shared secret, no login/session at all | Scoped to exactly one thing: `POST /api/network-scans` (submitting scan data) — cannot do anything else, by design |

They're unrelated and not interchangeable. An admin JWT won't work as the
Pi's API key, and the Pi's API key won't work for anything except that one
ingestion endpoint (confirmed and enforced server-side, not just a
convention).

---

## 2. Getting an Admin JWT

Only needed when testing via `curl`. Log in the same way the website does:

```bash
curl -X POST <backend-url>/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"<admin-username>","password":"<admin-password>"}'
```

Response looks like:
```json
{"token":"eyJhbGciOiJIUzI1NiJ9...","message":"Authentication successful","username":"root"}
```

Copy the `token` value — that's what goes in the `Authorization` header for
every subsequent admin API call.

---

## 3. Using the JWT

```bash
curl -H "Authorization: Bearer <token>" <backend-url>/api/network-scans
curl -H "Authorization: Bearer <token>" <backend-url>/api/network-scans/sources
curl -H "Authorization: Bearer <token>" <backend-url>/api/network-scans/agent-settings
```

**Important**: a JWT is only valid against the *one backend instance* that
issued it (each backend signs tokens with its own secret, `JWT_SECRET`). A
token from dev (`localhost:8080`) will never work against production
(`app.example.com`), and vice versa. If you switch which backend
you're testing, go back to step 2 and log in to *that* one.

---

## 4. Using the Pi's API Key

No login step — it's a static value, set once in `/etc/pi-scanner.env` on
each Pi (`API_KEY=...`) and in the backend's `.env` (`SCAN_API_KEY=...`).
The two just need to match exactly.

```bash
curl -X POST <backend-url>/api/network-scans \
  -H "X-API-Key: <the shared key>" \
  -H "Content-Type: application/json" \
  -d '{"sourceId":"pi-scanner","subnet":"192.168.2.0/24","hosts":[{"ip":"192.168.2.1"}]}'
```

Trying to use this key for anything other than that one `POST` endpoint
will correctly return `401` — that's the security boundary working as
intended, not a bug.

---

## 5. Dev vs. Production Cheat Sheet

| | Dev backend | Production backend |
|---|---|---|
| URL | `http://localhost:8080` | `https://app.example.com` |
| Admin login | `root` / `admin123` (dev default, see `compose.dev.yml`) | your real prod admin credentials |
| `SCAN_API_KEY` | `dev-only-pi-scanner-key-change-me` (fixed dev value in `compose.dev.yml`) | whatever real random value is in production's `.env` — check with `grep SCAN_API_KEY .env` on the server |

---

## Notes

- If a `curl` call returns `{"error":"Unauthorized","message":"Invalid or expired token"}`, check first whether you actually substituted a real token/key — pasting the literal placeholder text (e.g. `<admin JWT>`) is the most common mistake, not an actual bug.
- If a `curl` call returns `401` on `/api/network-scans` (GET) using the Pi's API key, that's expected — GET endpoints require an admin JWT, not the API key. Only `POST /api/network-scans` accepts the API key.
- JWTs from this app are long-lived (~15 days) — you usually don't need to re-login for every test, only when switching backends or after it actually expires.
