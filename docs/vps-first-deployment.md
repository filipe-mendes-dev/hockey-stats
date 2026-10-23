# First VPS deployment

Increment 3 is pending. Execute one step at a time and verify its checkpoint before continuing. Stop on a failed command or an unexpected result.

The target is Debian 13 on Netcup, user `deploy`, at `benchline.filipemendes.dev`. Existing prerequisites are SSH keys, firewall ports 22/80/443, Docker, Compose, host Nginx, its catch-all site and DNS. Confirm them in step 2. Keep the catch-all enabled; the portfolio remains on Vercel.

`deploy` is not in the Docker group, so every VPS Docker command uses `sudo`. System directory creation, package installation, Nginx changes and service management also require sudo. Source extraction and edits to deploy-owned files do not. Mac commands need no sudo. Keep the existing Docker permissions.

## 1. Mac: transfer the reviewed release

Commit the reviewed changes and confirm that `git status --short` is empty. The release archive contains committed files only.

Run on the Mac, without sudo:

```sh
cd /Users/filipemendes/Documents/Projects/hockey-stats
git status --short
BENCHLINE_RELEASE=$(git rev-parse HEAD)
printf '%s\n' "$BENCHLINE_RELEASE"
git archive --format=tar.gz --output="/tmp/benchline-${BENCHLINE_RELEASE}.tar.gz" "$BENCHLINE_RELEASE"
scp "/tmp/benchline-${BENCHLINE_RELEASE}.tar.gz" deploy@benchline.filipemendes.dev:/home/deploy/
ssh deploy@benchline.filipemendes.dev
```

Record the printed full commit ID for the next step. Verify any new SSH host key against the server's known fingerprint before accepting it. The archive includes committed configuration examples, not ignored local `.env` credentials. The VPS does not need GitHub credentials.

Checkpoint: the release archive exists under `/home/deploy` and the SSH session reports user `deploy`.

## 2. VPS: check the host and extract source

All remaining terminal commands run in the VPS SSH session unless labelled Mac. Replace `PASTE_FULL_COMMIT_ID` with the ID from step 1. This is first-deployment extraction; if `/opt/benchline` already contains an application, inspect it before replacing files.

```sh
whoami
sudo docker version
sudo docker compose version
sudo nginx -t
sudo ss -ltnp

BENCHLINE_RELEASE=PASTE_FULL_COMMIT_ID
sudo install -d -m 755 -o deploy -g deploy /opt/benchline
tar -xzf "/home/deploy/benchline-${BENCHLINE_RELEASE}.tar.gz" -C /opt/benchline
cd /opt/benchline
```

Checkpoint: user is `deploy`, Docker/Nginx checks succeed, port 3000 is available, and `Dockerfile`, `compose.production.yaml` and `deploy/postgres/init-benchline.sh` are present. Source extraction uses no sudo. Keep the same application directory and Compose project across releases.

## 3. VPS: create external credentials once

```sh
sudo install -d -m 700 -o deploy -g deploy /etc/benchline
if [ ! -e /etc/benchline/production.env ]; then
  install -m 600 .env.production.example /etc/benchline/production.env
fi
nano /etc/benchline/production.env
```

Use three independent generated values: run `openssl rand -hex 32` separately for `POSTGRES_ADMIN_PASSWORD` and `BENCHLINE_DB_PASSWORD`, then `openssl rand -hex 48` for `BETTER_AUTH_SECRET`. Enter the results in the editor, not in shell command arguments. The template expands the application password into `DATABASE_URL`; preserve that expression. Keep the default database/user names unless intentionally changing both their configuration and connection details.

Set `BETTER_AUTH_URL=https://benchline.filipemendes.dev`. Set the image reference, then validate without printing credentials:

```sh
sed -i "s|^BENCHLINE_IMAGE=.*|BENCHLINE_IMAGE=benchline-stats:sha-${BENCHLINE_RELEASE}|" /etc/benchline/production.env
stat -c '%U %a' /etc/benchline/production.env
sudo docker compose --env-file /etc/benchline/production.env -f compose.production.yaml config --quiet
```

Checkpoint: the file is owned by `deploy`, mode 600, all secret placeholders are replaced and configuration validates. Keep a recovery copy in your password manager. Do not print the full resolved Compose configuration. Image selection and credentials remain outside the application image.

## 4. VPS: build, initialize and verify loopback

```sh
sudo docker build --pull --tag "benchline-stats:sha-${BENCHLINE_RELEASE}" .
sudo docker compose --env-file /etc/benchline/production.env -f compose.production.yaml up -d --wait postgres
sudo docker compose --env-file /etc/benchline/production.env -f compose.production.yaml run --rm --no-deps app npm run db:migrate
sudo docker compose --env-file /etc/benchline/production.env -f compose.production.yaml run --rm --no-deps app npm run auth:bootstrap-admin
sudo docker compose --env-file /etc/benchline/production.env -f compose.production.yaml up -d --wait app
sudo docker compose --env-file /etc/benchline/production.env -f compose.production.yaml ps
curl --fail --silent --output /dev/null --write-out 'HTTP %{http_code}\n' http://127.0.0.1:3000/sign-in
```

Bootstrap is interactive and runs only for initial setup. Keep its password in your password manager. If an admin already exists, do not try to replace it through bootstrap.

Checkpoint: the build and migrations succeed; PostgreSQL is healthy; the app returns HTTP 200; only `127.0.0.1:3000` is published and PostgreSQL has no host port. Compose startup does not prove HTTP readiness, which is why the curl check is separate. For failures, inspect `sudo docker compose --env-file /etc/benchline/production.env -f compose.production.yaml logs --tail 100 app postgres`. Do not remove the data volume or run `down --volumes` to retry.

## 5. VPS: add the application Nginx site

Run `sudoedit /etc/nginx/sites-available/benchline` and paste this HTTP bootstrap configuration. This creates only the application site; keep the existing catch-all enabled.

```nginx
server {
    listen 80;
    server_name benchline.filipemendes.dev;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
        proxy_buffering off;
        proxy_cache off;
    }
}
```

Nginx overwrites forwarded client addresses at the single public proxy. The configuration preserves application cache headers, worker scope and streamed responses. Proxy buffering and shared caching are disabled.

```sh
sudo ln -s /etc/nginx/sites-available/benchline /etc/nginx/sites-enabled/benchline
sudo nginx -t
sudo systemctl reload nginx
curl --fail --silent --output /dev/null --write-out 'HTTP %{http_code}\n' -H 'Host: benchline.filipemendes.dev' http://127.0.0.1/sign-in
```

Checkpoint: Nginx syntax is valid and the hostname selects the app with HTTP 200. Confirm public DNS points to this VPS; any AAAA record must also reach a working IPv6 listener, otherwise correct it before certificate issuance. Do not sign in over public HTTP. The configured authentication origin remains HTTPS.

## 6. VPS: issue HTTPS and verify renewal

Use Debian's packaged Nginx plugin, without installing another Certbot distribution on top of an existing installation:

```sh
sudo apt update
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d benchline.filipemendes.dev --redirect
sudo nginx -t
sudo systemctl enable --now certbot.timer
sudo certbot renew --dry-run
systemctl list-timers certbot.timer
```

Certbot asks for your contact email and agreement to its terms. It installs the certificate and HTTPS redirect in the named Nginx site. If certificate issuance fails, inspect DNS and access to port 80 before retrying. Do not bypass certificate validation or change the application origin to public HTTP.

Checkpoint: certificate issuance and the renewal dry-run succeed, and the renewal timer is scheduled. The package exists for [Debian 13](https://packages.debian.org/trixie/python3-certbot-nginx); consult [Certbot](https://certbot.eff.org/instructions) for certificate troubleshooting.

## 7. Mac: verify the public app

Run on the Mac, without sudo:

```sh
curl -I http://benchline.filipemendes.dev/sign-in
curl -I https://benchline.filipemendes.dev/sign-in
curl -I https://benchline.filipemendes.dev/serwist/sw.js
```

Checkpoint: HTTP redirects to HTTPS, HTTPS succeeds without a certificate warning, and the worker response retains `Service-Worker-Allowed: /` and its no-store cache policy. In a browser, sign in as the bootstrap admin, wait for offline readiness, verify a disposable local record survives offline reload, then reconnect and confirm synchronization. Check the portfolio still works separately on Vercel.

This establishes public application access with disposable data. Complete the agreed off-server backup/restore step before important data or invited-user use. Never clear IndexedDB or force sign-out as an update procedure.

## Future GHCR delivery

The same Dockerfile, production Compose services, named database volume and external credentials remain in use. Later replace the build with `sudo docker login ghcr.io` and an explicit image pull, set `BENCHLINE_IMAGE` to the published version/digest, then use the same migration/start procedure. Docker registry authentication must use sudo as well, because the server Docker commands run as root. CI/CD setup remains a later increment.

Sources: [Nginx proxy directives](https://nginx.org/en/docs/http/ngx_http_proxy_module.html), [Next.js self-hosting](https://nextjs.org/docs/app/guides/self-hosting).
