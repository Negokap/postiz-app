#!/bin/bash
# On-server deploy for Setjoo Social. Run as root (CodeBuild calls it with sudo) from
# /opt/setjoo-social, after buildspec.yml pushed the image for POSTIZ_TAG to ECR.
#
#   Redeploy:  sudo POSTIZ_REPO=<ecr repo> POSTIZ_TAG=<git sha> bash deploy.sh
#   Rollback:  same, with an older sha (the last good one is in .deployed-tag)
#
# Every check that can fail runs before the live containers are touched.
# There is no migration step: the image runs `prisma db push` when it starts, so the
# schema only moves forward and a rollback restores the old image, not the old schema.
set -euo pipefail
cd "$(dirname "$0")"
: "${POSTIZ_REPO:?}" "${POSTIZ_TAG:?}"
export POSTIZ_IMAGE="$POSTIZ_REPO:postiz-$POSTIZ_TAG" DOCKER_CONFIG="$PWD/.docker"
export TEMPORAL_DYNAMICCONFIG_DIR="$PWD/dynamicconfig"
PUBLIC_URL="https://social.setjoo.com"
KEEP_TAGS=3

# One deploy at a time on this box (same lock name as the other Setjoo deploys).
exec 9>/var/lock/setjoo-deploy.lock
flock -w 1200 9 || { echo "FATAL: another deploy has held the lock for 20 minutes"; exit 1; }

echo "=== [Setjoo Social deploy] $(date) tag $POSTIZ_TAG ==="

echo ">>> [1/4] Secrets from Infisical"
bash ./sync-env.sh postiz

echo ">>> [2/4] Pre-flight"
for key in MAIN_URL FRONTEND_URL NEXT_PUBLIC_BACKEND_URL JWT_SECRET POSTIZ_DB_PASSWORD TEMPORAL_DB_PASSWORD \
  POSTIZ_OAUTH_CLIENT_SECRET POSTIZ_OAUTH_URL POSTIZ_OAUTH_AUTH_URL POSTIZ_OAUTH_TOKEN_URL POSTIZ_OAUTH_USERINFO_URL \
  STORAGE_PROVIDER; do
  grep -q "^$key=." .env || { echo "FATAL: $key missing or empty in Infisical postiz/prod"; exit 1; }
done
docker compose config -q
docker compose pull --quiet

PREV_TAG=$(cat .deployed-tag 2>/dev/null || true)
healthy() {
  # First start runs prisma db push and boots three apps, so allow up to 5 minutes.
  for _ in $(seq 1 60); do
    curl -fsS -o /dev/null --max-time 5 "$PUBLIC_URL/" \
      && curl -fsS -o /dev/null --max-time 5 "$PUBLIC_URL/api/" && return 0
    sleep 5
  done
  return 1
}

echo ">>> [3/4] Starting $POSTIZ_TAG"
if docker compose up -d --no-build --remove-orphans && healthy; then
  echo "$POSTIZ_TAG" > .deployed-tag
else
  docker compose logs --tail 60 postiz temporal || true
  if [ -n "$PREV_TAG" ]; then
    echo "!!! Unhealthy, rolling back to $PREV_TAG"
    POSTIZ_IMAGE="$POSTIZ_REPO:postiz-$PREV_TAG" docker compose up -d --no-build
    healthy && echo "!!! Rolled back, site is up on $PREV_TAG" || echo "!!! ROLLBACK ALSO UNHEALTHY, check by hand"
  fi
  exit 1
fi

echo ">>> [4/4] Removing images older than the newest $KEEP_TAGS deploys"
docker images "$POSTIZ_REPO" --format '{{.Repository}}:{{.Tag}}' | tail -n +$((KEEP_TAGS + 1)) | while read -r ref; do
  docker rmi "$ref" >/dev/null 2>&1 || true
done
docker image prune -f >/dev/null
echo "=== Done: $PUBLIC_URL is on $POSTIZ_TAG ==="
