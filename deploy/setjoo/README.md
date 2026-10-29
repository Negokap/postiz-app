# Setjoo Social (Postiz)

This branch (`setjoo`) runs Postiz as **Setjoo Social** (`social.setjoo.com`)
on its own server, with Setjoo Identity as the only login.

`main` tracks upstream [gitroomhq/postiz-app](https://github.com/gitroomhq/postiz-app)
unchanged. All Setjoo changes live on `setjoo`.

## Run locally

Setjoo Identity (private repo `Negokap/setjoo`) must be running on
`http://127.0.0.1:5006` with `SETJOO_CLIENT_SECRET_SOCIAL` set. The full
two-repo setup is in that repo's `docs/SETJOO_SOCIAL.md` → *Developer setup*.

```bash
cd deploy/setjoo
cp .env.example .env
# Fill JWT_SECRET, POSTIZ_DB_PASSWORD, TEMPORAL_DB_PASSWORD (openssl rand -hex 32)
# POSTIZ_OAUTH_CLIENT_SECRET = Identity's SETJOO_CLIENT_SECRET_SOCIAL
docker compose up -d
```

Open http://127.0.0.1:5028 and choose **Continue with Setjoo**.

| Service | Purpose |
|---|---|
| `postiz` | App: frontend, backend API, and orchestrator (port 5028 → 5000) |
| `postiz-postgres`, `postiz-redis` | Postiz data and cache |
| `temporal`, `temporal-postgresql`, `temporal-elasticsearch` | Job runner that publishes scheduled posts |
| `temporal-ui` | Optional: `docker compose --profile debug up -d temporal-ui` → http://127.0.0.1:8080 |

## Rules for this repo

- **It is public and AGPL-3.0.** Never commit `.env`, secrets, or Setjoo
  proprietary code. Setjoo-specific logic belongs in the private `setjoo` repo
  and talks to Postiz through OIDC and the Postiz public API.
- Every change deployed to `social.setjoo.com` must be pushed here (AGPL §13).
- Keep changes small so upstream merges stay easy. Follow the root `CLAUDE.md`
  (pnpm only; DTO → Controller → Service → Repository).
- Updating from upstream:
  ```bash
  git remote add upstream https://github.com/gitroomhq/postiz-app.git  # once
  git fetch upstream
  git checkout main && git merge upstream/main && git push
  git checkout setjoo && git merge main && git push
  ```

## Production

Dedicated server `sj-social-prod-01` (4 vCPU / 8 GB / 80 GB). Same compose
file, with the production URLs in `.env`, S3-compatible media storage, TLS in
front of port 5028 (`POSTIZ_BIND=127.0.0.1`), daily Postgres backups, and a
disk alert. Details: `docs/SETJOO_SOCIAL.md` in the setjoo repo.
