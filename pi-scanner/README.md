# pi-scanner

Runs `nmap -sn` on the Pi every `INTERVAL_SECONDS` and POSTs discovered hosts
to the backend's `/api/network-scans` endpoint. See the approved plan for
the backend side.

## Deploy to the Pi

Copy these three files onto the Pi (adjust the IP to yours):

```bash
scp scan.py pi-scanner.env.example pi-scanner.service pi-scanner@192.168.2.22:/tmp/
```

Then on the Pi (`ssh pi-scanner@192.168.2.22`):

```bash
sudo apt install -y python3-requests   # requests isn't in the base image
sudo mkdir -p /opt/pi-scanner
sudo mv /tmp/scan.py /opt/pi-scanner/scan.py

sudo mv /tmp/pi-scanner.env.example /etc/pi-scanner.env
sudo nano /etc/pi-scanner.env          # fill in BACKEND_URL, API_KEY, SUBNET
sudo chmod 600 /etc/pi-scanner.env

sudo mv /tmp/pi-scanner.service /etc/systemd/system/pi-scanner.service
sudo systemctl daemon-reload
sudo systemctl enable --now pi-scanner
```

## Verify

```bash
journalctl -u pi-scanner -f            # watch it scan/report live
```

From the backend host (requires an admin JWT, not the Pi's API key - see
the main backend docs for how to get one):
```bash
curl -H "Authorization: Bearer <admin JWT>" http://localhost:8080/api/network-scans
```
Row count should grow roughly every `INTERVAL_SECONDS` while `pi-scanner`
runs (subject to each agent's configured write-throttle - see "Manage
Agent Settings" on the admin Network Scans page).

## Multiple Agents

Every scan row is tagged with `SOURCE_ID` from the agent's env file - that's
the only thing that identifies *which* agent a row came from. There's no
separate "register this agent" step: the first time a `SOURCE_ID` shows up
in a POST, it just appears in the admin UI's source dropdown and the
"Manage Agent Settings" dialog automatically.

**What must be unique per agent**: `SOURCE_ID`. Two agents sharing a
`SOURCE_ID` will have their data merged into one identity - the backend has
no way to tell them apart.

**What's shared across all agents (by design, for now)**: `API_KEY`. This
project deliberately uses one shared key for every agent rather than
per-agent keys (see the plan notes if you want to revisit that later - it's
an easy upgrade path, not a redesign, since `sourceId` is already a plain
field the backend could tie a per-agent key to).

**What varies per agent based on its actual deployment**: `SUBNET` (each
site's own network), `BACKEND_URL` (only differs if agents point at
different backend environments), `INTERVAL_SECONDS` (a Pi-local setting -
retention and write-throttle are configured centrally per-agent from the
admin UI instead, not from the Pi's env file).

### Deploying another physical Pi

Same steps as "Deploy to the Pi" above, on the new device. The only field
you must change from the example is `SOURCE_ID`:

```bash
# In /etc/pi-scanner.env on the new Pi:
SOURCE_ID=pi-warehouse        # anything unique - pi-scanner, pi-office, pi-2, etc.
SUBNET=10.0.5.0/24            # that site's actual subnet, from `ip route` on that Pi
```

Once it starts reporting, it'll show up as a new entry in the admin Network
Scans page's source filter dropdown and "Manage Agent Settings" dialog
automatically - no backend restart or code change needed.

### Testing multi-agent behavior locally (no second Pi needed)

To see two agents show up distinctly in the admin UI without buying/
provisioning real hardware, just run a second copy of `scan.py` from any
machine that has Python 3, `requests`, and `nmap` (a WSL/Linux shell on
your dev PC works fine - `sudo apt install nmap python3-requests`):

```bash
BACKEND_URL=http://localhost:8080 \
API_KEY=dev-only-pi-scanner-key-change-me \
SUBNET=192.168.2.0/24 \
SOURCE_ID=pi-test-2 \
INTERVAL_SECONDS=60 \
python3 scan.py
```

That's the exact same script and backend your real `pi-scanner` already
uses - just invoked directly with env vars on the command line instead of
via systemd, and with a different `SOURCE_ID` so the backend treats it as
a second, independent agent. Open the "Manage Agent Settings" dialog on
the Network Scans admin page and you should see both `pi-scanner` and
`pi-test-2` listed, each independently configurable. Ctrl+C stops it -
nothing to clean up on the backend side (its rows just age out via the
normal retention job, or you can delete `scan_hosts`/`scan_agent_settings`
rows for that `sourceId` directly via `psql` if you want it gone sooner).
