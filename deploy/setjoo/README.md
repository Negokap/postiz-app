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

```
merge to setjoo ──▶ AWS CodeBuild "postiz-build" ──▶ ECR "postiz" ──▶ hst-5 (45.90.108.159) ──▶ https://social.setjoo.com
                    buildspec.yml: one image,          tag             deploy.sh: secrets from Infisical,
                    tagged postiz-<commit>             postiz-<sha>    start, health check, auto-rollback
```

Production only, no staging. hst-5 is shared with the idle `notify.setjoo.com`
mail relay (postfix, rspamd, host redis): leave those alone. Same compose file
as local, with the production URLs in `.env`, nginx + Let's Encrypt in front of
`127.0.0.1:5028`, S3-compatible media storage, daily Postgres backups, and a
disk alert. More context: `docs/SETJOO_SOCIAL.md` in the setjoo repo.

### For developers

1. Branch off `setjoo`, open a PR into `setjoo`.
2. After review, merge. About 20–30 minutes later the change is live; the
   CodeBuild log shows each step.

You never need AWS access, server access or secret values. If your change needs
a new environment variable, put its **name** in the PR description; Arya adds
the value to Infisical (`postiz` project, `prod`) before the merge.

### Running it by hand (people with server access)

- Status: `ssh hst-5 'cat /opt/setjoo-social/.deployed-tag; sudo docker ps'`
- Redeploy or roll back to a commit already in ECR:
  `ssh hst-5 'sudo POSTIZ_REPO=535391556744.dkr.ecr.us-east-1.amazonaws.com/postiz POSTIZ_TAG=<sha> bash /opt/setjoo-social/deploy.sh'`
  (the box's ECR login lasts 12 hours; re-run `postiz-build` if it expired).
- Temporal UI: `sudo docker compose --profile debug up -d temporal-ui` in
  `/opt/setjoo-social`, then `ssh -L 8080:127.0.0.1:8080 hst-5`.

### Secrets

All runtime config is in Infisical project **`postiz`, env `prod`**
(secrets.pierrepjoseph.com). Every deploy exports it into
`/opt/setjoo-social/.env` (root-only); the keys are the ones in
`.env.example`, with production values. `deploy.sh` refuses to start if a
required one is missing. The box's machine identity is read-only.

### One-time setup

| Done | Step |
|---|---|
| ✅ | ECR `postiz` (keeps the last 10 images), IAM `postiz-codebuild-role` (ECR on `postiz`, SSM `/postiz/*`, logs), SSM SecureString `/postiz/deploy-ssh-key`, CodeBuild `postiz-build` (standard:7.0, privileged, LARGE, buildspec `deploy/setjoo/buildspec.yml`, PUSH webhook on `^refs/heads/setjoo$`) |
| ✅ | hst-5: pipeline key in `deploy`'s `authorized_keys`, Infisical CLI, `/opt/setjoo-social`, nginx site for `social.setjoo.com`, ufw 80/443 |
| Arya | DNS: `social.setjoo.com` A → 45.90.108.159 (Cloud DNS), then `sudo certbot --nginx -d social.setjoo.com` on hst-5 |
| Arya | Infisical project `postiz` / `prod`: import `/root/postiz-import.env` on hst-5 (generated secrets + production URLs), fill the empty keys, delete the file; read-only machine identity into `/root/.infisical/postiz.env` |
| Arya / Pierre | Setjoo Identity: deploy the `setjoo-social` client with `SETJOO_CLIENT_SECRET_SOCIAL` = Infisical's `POSTIZ_OAUTH_CLIENT_SECRET`, redirect URI `https://social.setjoo.com/settings` |
| ✅ | Rebrand: `bash deploy/setjoo/rebrand.sh` renames visible "Postiz" to "Setjoo Social" (UI, all translations, emails). Re-run after every upstream merge |
| Arya | GitHub: protect `setjoo` (PR + one review). Merging is then the only way to deploy |
