# Deployment guide (GitHub Actions to AWS EC2)

This guide explains how the application is deployed to an AWS EC2 virtual machine by the `Deploy` workflow (`.github/workflows/deploy.yml`). The decision to use GitHub Actions is described in [ci-cd.md](tech-stack/ci-cd.md).

## How it works

```text
merge to main -> CI workflow passes -> Deploy workflow
  1. builds the frontend (bun, VITE_API_URL=/)
  2. uploads backend/, the built frontend and deploy/ to the server over SSH (rsync)
  3. runs deploy/deploy.sh on the server (pip install, restart the service)
  4. calls http://<host>/health to check that the API is up
```

On the server:

| What | Where |
|---|---|
| Backend code and virtualenv | `/opt/prostefakty/backend/` |
| Environment file (secrets) | `/opt/prostefakty/.env` |
| Built frontend | `/var/www/prostefakty/` |
| systemd service | `prostefakty-backend` (uvicorn on `127.0.0.1:8000`) |
| nginx | serves the frontend and proxies `/explain` and `/health` to the backend |

The server does not need access to GitHub: the workflow pushes the files. Nobody has to be logged in to GitHub for a deployment to run.

## One-time setup

### 1. Prepare the server

Create the EC2 instance (Ubuntu, with a public Elastic IP so the address does not change), then run the setup script once:

```bash
scp -i <your-key>.pem -r deploy ubuntu@<EC2_IP>:/tmp/
ssh -i <your-key>.pem ubuntu@<EC2_IP> \
  'sudo mkdir -p /opt/prostefakty/deploy && sudo cp /tmp/deploy/* /opt/prostefakty/deploy/ \
   && sudo chown -R ubuntu:ubuntu /opt/prostefakty && bash /opt/prostefakty/deploy/setup-server.sh'
```

Then put the Gemini API key on the server (never in Git or in GitHub Actions):

```bash
ssh -i <your-key>.pem ubuntu@<EC2_IP>
nano /opt/prostefakty/.env          # GEMINI_API_KEY=...
sudo systemctl restart prostefakty-backend
```

The application starts without a key, but `/explain` returns an error until a key is set.

### 2. Create a dedicated deployment key

Do not reuse the `.pem` file from AWS. Create a separate key that is used only by GitHub Actions:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/prostefakty_deploy -N "" -C "github-actions-deploy"
```

Add the public key to the server:

```bash
cat ~/.ssh/prostefakty_deploy.pub | ssh -i <your-key>.pem ubuntu@<EC2_IP> \
  'cat >> ~/.ssh/authorized_keys'
```

Check that it works: `ssh -i ~/.ssh/prostefakty_deploy ubuntu@<EC2_IP> whoami` should print `ubuntu`.

### 3. Open the network ports

In the EC2 Security Group:

| Port | Source | Why |
|---|---|---|
| 80 (HTTP) | `0.0.0.0/0` | Users open the application. |
| 22 (SSH) | `0.0.0.0/0` | GitHub-hosted runners connect from changing IP addresses. |

Port 22 open to the internet is acceptable only because login uses keys and password login is disabled on Ubuntu EC2 by default. A safer option is a self-hosted runner or AWS Systems Manager (see [ci-cd.md](tech-stack/ci-cd.md)).

### 4. Add the secrets in GitHub

This needs admin rights on the repository. Add these as repository secrets (**Settings → Secrets and variables → Actions**), or as secrets of a `production` environment with optional **Required reviewers** for a manual approval before each deployment:

| Secret | Value |
|---|---|
| `EC2_HOST` | The Elastic IP or DNS name of the server. |
| `EC2_USER` | `ubuntu` |
| `EC2_SSH_KEY` | The full content of `~/.ssh/prostefakty_deploy` (the private key, including the `BEGIN` and `END` lines). |

### 5. Merge the workflows

The workflows only run once they are on `main`. Merge the pull request that adds `.github/workflows/ci.yml` and `deploy.yml`.

## Deploying

- **Automatic:** every merge to `main` runs CI and, if it passes, the Deploy workflow.
- **Manual:** **Actions → Deploy → Run workflow**, choose `main`.

After a run, open `http://<EC2_HOST>/` and `http://<EC2_HOST>/health` (expected `{"status":"ok"}`).

## Changing the server configuration

The `Deploy` workflow updates the application (backend, frontend and the files in `deploy/`) but **does not apply** `deploy/nginx.conf` or `deploy/prostefakty-backend.service` to the system. These two files are copied only by `setup-server.sh`. After changing one of them, apply it by hand:

```bash
# nginx
sudo cp /opt/prostefakty/deploy/nginx.conf /etc/nginx/sites-available/prostefakty
sudo nginx -t && sudo systemctl reload nginx

# systemd unit
sudo cp /opt/prostefakty/deploy/prostefakty-backend.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl restart prostefakty-backend
```

Always run `sudo nginx -t` before reloading: a broken configuration is not loaded by the running nginx, but it stops nginx from starting after a reboot. The `Deploy` workflow uploads the latest `deploy/` folder first, so run these commands after a deployment.

## Checking and troubleshooting

```bash
ssh -i ~/.ssh/prostefakty_deploy ubuntu@<EC2_IP>
sudo systemctl status prostefakty-backend
journalctl -u prostefakty-backend -n 50 --no-pager
sudo nginx -t
```

| Symptom | Likely cause |
|---|---|
| `Permission denied (publickey)` in the workflow | `EC2_SSH_KEY` is incomplete, or its public key is not in `authorized_keys`. |
| `Connection timed out` in the workflow | Port 22 is not open to GitHub runners. |
| Health check fails | The service is not running: check `journalctl`. Common cause: a dependency that does not install on the server's Python version. |
| `/explain` returns 502 | `GEMINI_API_KEY` is missing or invalid in `/opt/prostefakty/.env`. |
| Site does not open in the browser | Port 80 is closed in the Security Group, or the IP changed (use an Elastic IP). |
| Browser error `Failed to fetch dynamically imported module ... .mjs` | nginx serves `.mjs` files with a wrong content type. `deploy/nginx.conf` contains the fix; apply it as described above. |

## Rollback

Revert the faulty commit on `main` through a pull request. The merge starts a new deployment of the previous state. For an urgent fix, run the Deploy workflow manually from the last good commit.

## Limitations

- The site is served over **HTTP only**. HTTPS needs a domain name (for example with Caddy or Certbot). Do not use real personal documents until it is configured.
- Do not commit `.env`, the `.pem` file, or the deployment private key.
- CI does not call the real Gemini API; tests use mocks.
