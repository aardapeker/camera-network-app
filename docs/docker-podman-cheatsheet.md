# Docker ↔ Podman Cheat Sheet

Quick reference for working on this project across both machines: the server runs
Docker, local Fedora development runs rootless Podman. For the full setup and the
reasoning behind the compose changes, see [podman-development.md](./podman-development.md).

---

## Running the dev stack

| Windows / Docker       | Fedora / Podman    |
| ---------------------- | ------------------ |
| `./dev.ps1 up --build` | `bash dev.sh up`   |
| `./dev.ps1 up`         | `bash dev.sh up`   |
| `./dev.ps1 down`       | `bash dev.sh down` |

Notes:

- **`--build` is redundant.** Both scripts hardcode `up -d --build` in the `up`
  branch, so `up` and `up --build` are the same command. There is no non-building
  `up`.
- **Use `bash dev.sh`,** not `./dev.sh` — the file is mode `100644` in git and is not
  executable. Run `chmod +x dev.sh` locally if you prefer, but that shows up as a mode
  change in git.
- **`dev.sh` picks the engine automatically:** `docker compose` when Docker is on
  `PATH`, otherwise `podman compose`. Force one with
  `COMPOSE="podman compose" bash dev.sh up`.
- For a cache-free rebuild: `bash dev.sh build` then `bash dev.sh up`.

---

## Cleanup / pruning

| Docker                              | Podman                              | Note                        |
| ----------------------------------- | ----------------------------------- | --------------------------- |
| `docker system prune -a`            | `podman system prune -a`            | Does **not** touch volumes  |
| `docker system prune -a --volumes`  | `podman system prune -a --volumes`  | Volumes included            |
| `docker volume prune -a`            | `podman volume prune`               | `-a` doesn't exist          |
| — (no direct equivalent)            | `podman system reset`               | Factory reset               |

### Gotchas

- **`podman volume prune -a` fails** with `Error: unknown shorthand flag: 'a' in -a`.
  Docker needed `-a` because its `volume prune` only removed *anonymous* volumes by
  default. Podman's already removes every unused volume, named or not, so there is no
  flag to add.

- **`podman system prune -a` leaves volumes alone.** If you read `-a` as "everything",
  add `--volumes` explicitly — otherwise the Postgres data survives a prune you
  thought was total.

- **Running containers protect their volumes.** Pruning while the stack is up will not
  delete the database. Run `bash dev.sh down` first if you actually want it gone.

- **Rootless is per-user.** These commands only affect your own store. Anything under
  `sudo podman` lives in a separate store and is untouched.

- **`podman system reset` also wipes networks** and does not restart `podman.socket`.
  If the socket was in use, check it afterwards:

  ```bash
  systemctl --user is-active podman.socket
  systemctl --user start podman.socket   # if needed
  ```

### After a full reset: builds appear to hang

`podman system reset` also deletes `~/.cache/containers/short-name-aliases.conf`. With
Fedora's default `short-name-mode = "enforcing"`, Podman then has no cached answer for
unqualified images like `eclipse-temurin:25-jdk` and **prompts you to pick a registry**
mid-build. Under `podman-compose` that prompt is easy to miss and looks like a frozen
build; without a terminal it fails with `short-name resolution enforced but cannot
prompt without a TTY`.

One-time fix, local to your machine:

```bash
mkdir -p ~/.config/containers
cat > ~/.config/containers/registries.conf <<'EOF'
unqualified-search-registries = ["docker.io", "registry.fedoraproject.org", "registry.access.redhat.com"]
short-name-mode = "disabled"
EOF
```

Use `disabled`, not `permissive` — `permissive` only skips the prompt when there is no
TTY, so it still stops and asks in an interactive terminal. `docker.io` is the right
answer for every image in this project, and `disabled` picks it for you.

### After a full reset

A reset removes the built images, the `fielddesk_postgres_dev_data` volume (the dev
database, including the seeded `root` admin user), and the `maven_cache` volume.

```bash
bash dev.sh up
```

This rebuilds both images and recreates the database from scratch. The backend is the
slow part — with `maven_cache` gone, Maven re-downloads every dependency.

---

## Stale `node_modules`

Not a prune issue, but it looks like one. `compose.dev.yml` mounts an anonymous volume
at `/app/node_modules`, populated once at container creation and never refreshed. After
adding a frontend dependency you get `Cannot find module '<name>'` even though it is in
`package.json`. Same behaviour on Docker.

```bash
podman rm -f fielddesk-dev-frontend
podman volume ls | grep frontend      # find the anonymous volume
podman volume rm <that-volume>
podman compose -f compose.dev.yml build frontend
podman compose -f compose.dev.yml up -d
```
