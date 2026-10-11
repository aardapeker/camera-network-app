# Developing with Podman

The server runs this project on Docker. On a local Linux workstation you can run the
same compose files on rootless Podman instead — no separate Podman-specific compose
file is needed.

---

## 1. Prerequisites

```bash
sudo dnf install podman podman-compose   # Fedora
podman --version                          # 5.x
```

Rootless Podman needs a subuid/subgid range for your user. Fedora sets this up on
install; verify with:

```bash
grep "^$(id -un)" /etc/subuid /etc/subgid
```

If either line is missing, add it with `sudo usermod --add-subuids 524288-589823 --add-subgids 524288-589823 $(id -un)`.

---

## 2. Short-name resolution (do this first)

Fedora ships `short-name-mode = "enforcing"` with three search registries. Podman will
not guess which one an unqualified image like `eclipse-temurin:25-jdk` comes from, so
it stops and **prompts you to choose**. Under `podman-compose` that prompt is easy to
miss and looks exactly like a hung build; non-interactively it fails with:

```
Error: creating build container: short-name resolution enforced but cannot prompt without a TTY
```

Confusingly this only bites on a cold store. Once an image is pulled, the answer is
cached in `~/.cache/containers/short-name-aliases.conf` and nothing prompts again — so
the problem reappears out of nowhere after `podman system reset`, which deletes that
cache.

Fix it once, at the user level, so nothing in the repo has to change:

```bash
mkdir -p ~/.config/containers
cat > ~/.config/containers/registries.conf <<'EOF'
unqualified-search-registries = ["docker.io", "registry.fedoraproject.org", "registry.access.redhat.com"]
short-name-mode = "disabled"
EOF
```

It must be `disabled`, not `permissive`. Per `man containers-registries.conf`,
`permissive` "behaves as enforcing but does not lead to an error if the program is not
running in a terminal" — so it still prompts in an interactive shell, which is exactly
where you run builds. Only `disabled` uses the search registries without ever
prompting.

Docker Hub is first because that is where all of this project's base images live. Note
this file *replaces* `/etc/containers/registries.conf` rather than merging with it,
which is why the whole search list is repeated.

Verify with an image that has no cached alias, under a real terminal — a pull with
stdin closed passes even in `permissive` mode and proves nothing:

```bash
podman pull caddy:alpine
```

Expect `Resolving "caddy" using unqualified-search registries` and no prompt. Once an
image has been pulled its alias is cached in
`~/.cache/containers/short-name-aliases.conf` and it will not prompt regardless of
mode, so always test with something not yet pulled.

The alternative is fully qualifying the images (`FROM docker.io/library/eclipse-temurin:25-jdk`)
in the Dockerfiles. That works on Docker too, but it edits files the server also builds
from, so the local config above is the lower-risk option.

---

## 3. Running the stack

`dev.sh` picks the container engine automatically: it uses `docker compose` when
Docker is on `PATH` (the server), and falls back to `podman compose` otherwise.

```bash
bash dev.sh up      # full stack: db + backend + frontend
bash dev.sh db      # database only, run backend/frontend on the host
bash dev.sh logs
bash dev.sh down
```

To force a specific engine, set `COMPOSE`:

```bash
COMPOSE="podman compose" bash dev.sh up
```

Coming from `dev.ps1` on Windows, the commands map one to one:

| Windows / Docker      | Linux / Podman     |
| --------------------- | ------------------ |
| `./dev.ps1 up --build` | `bash dev.sh up`   |
| `./dev.ps1 up`         | `bash dev.sh up`   |
| `./dev.ps1 down`       | `bash dev.sh down` |

Note that `up` already runs `up -d --build` in both scripts, so passing `--build`
yourself changes nothing — the two `up` rows above are the same command. For a
cache-free rebuild use `bash dev.sh build` followed by `bash dev.sh up`.

Services come up on the usual ports — frontend `5173`, backend `8080`, database
`5432`, JVM debug `5005`.

---

## 4. SELinux and bind mounts

This is the one change the compose files needed. On Fedora, SELinux is enforcing and
files in your home directory are labeled `user_home_t`. Containers run as
`container_t` and **cannot read that label**, so every hot-reload bind mount fails:

- Frontend: `EACCES: permission denied, open '/app/src/routes.ts'`
- Backend: `No plugin found for prefix 'spring-boot'` (Maven cannot read `pom.xml`)

Docker on the server never hits this because its daemon runs unconfined.

The fix is the `:z` mount flag, which tells the runtime to relabel the host path to
`container_file_t`:

```yaml
- ./backend/src:/app/src:ro,z
- ./frontend/src:/app/src:z
```

`:z` is part of the compose spec and Docker accepts it too — it is a no-op on hosts
without SELinux, so the same file works on both machines. Use lowercase `z` (shared
label), not `Z` (private label), since more than one container may read these paths.

Relabeling is persistent and applies to the host directory. It does not affect your
ability to edit those files normally.

---

## 5. Stale `node_modules` after adding a dependency

`compose.dev.yml` mounts an anonymous volume at `/app/node_modules` so the container
keeps the `node_modules` baked into its image instead of the host's. That volume is
populated once, at container creation, and then **never updates** — so after adding a
package to `frontend/package.json` you get a runtime error like
`Cannot find module 'i18next'` even though the dependency is clearly installed.

This is not Podman-specific; it behaves the same on Docker. Rebuild the image and
drop the volume:

```bash
podman rm -f fielddesk-dev-frontend
podman volume ls | grep frontend          # find the anonymous volume
podman volume rm <that-volume>
podman compose -f compose.dev.yml build frontend
podman compose -f compose.dev.yml up -d
```

---

## 6. Notes and caveats

- **`podman compose` is a shim.** Podman 5 delegates to whichever compose provider it
  finds — here `podman-compose`. It prints a `>>>> Executing external compose provider`
  notice on every run, which is harmless. If you want behaviour identical to the
  server, install Compose v2 (`sudo dnf install docker-compose`) and point it at
  Podman's socket:

  ```bash
  systemctl --user enable --now podman.socket
  export DOCKER_HOST=unix:///run/user/$(id -u)/podman/podman.sock
  docker-compose -f compose.dev.yml up -d
  ```

- **Pods.** `podman-compose` groups the services into a pod (`pod_fielddesk`).
  Service-name DNS (`db`, `backend`) works as expected, so this is mostly invisible.

- **Production stays on Docker.** `compose.yml` is deliberately left untouched — it
  runs on the server under Docker and is not part of the Podman workflow. Podman is
  only used locally, with `compose.dev.yml` / `compose.db-only.yml`.

  If you ever do run `compose.yml` on Podman locally, expect two obstacles: it
  publishes ports `80` and `443`, which rootless Podman cannot bind (lower the
  threshold with `sudo sysctl net.ipv4.ip_unprivileged_port_start=80`, or remap to
  `8080:80` / `8443:443`), and its `./Caddyfile` mount would need a `:z` for SELinux.

- **`dev.sh` is not executable** in git (mode `100644`), so invoke it as `bash dev.sh`
  or run `chmod +x dev.sh` locally.
