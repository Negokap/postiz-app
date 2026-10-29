#!/bin/bash
# Renames user-visible "Postiz" to "Setjoo Social" (UI text, all translations, emails,
# provider error messages, MCP/agent tool text). Re-run after every upstream merge:
#   bash deploy/setjoo/rebrand.sh && git diff --stat
#
# Whole word, case-sensitive, so `postiz` package names, URLs and identifiers stay.
# Left alone on purpose:
#   - "Postiz Cloud" (upstream's hosted service, named in the MCP relay texts)
#   - comments
#   - mcp.relay.service.ts (talks about Postiz Cloud), HTTP User-Agents, Sentry names
#   - apps/orchestrator workflows (existing workflow files must never change, see CLAUDE.md)
set -euo pipefail
cd "$(dirname "$0")/../.."

files=$(
  {
    grep -rlw --include='*.json' 'Postiz' libraries/react-shared-libraries/src/translation/locales || true
    grep -rlw --include='*.ts' --include='*.tsx' 'Postiz' \
      apps/frontend/src apps/backend/src libraries/nestjs-libraries/src libraries/react-shared-libraries/src libraries/helpers/src || true
  } | grep -v -E 'mcp\.relay\.service\.ts|self\.hosted\.component\.tsx|sentry/|wordpress\.provider\.ts|tumblr\.provider\.ts' || true
)

for f in $files; do
  perl -pi -e '
    next if m{^\s*(//|\*|/\*|\{/\*)};          # comments
    s/\bPostiz\b(?! Cloud)(?!\/)/Setjoo Social/g;  # keep "Postiz Cloud" and "Postiz/1.0" UAs
  ' "$f"
done
echo "rebrand: $(echo "$files" | grep -c . || true) file(s) checked"
grep -rnw --include='*.ts' --include='*.tsx' --include='*.json' 'Postiz' \
  apps/frontend/src libraries/react-shared-libraries/src/translation libraries/nestjs-libraries/src \
  | grep -v -E 'Postiz Cloud|mcp\.relay|self\.hosted|sentry/|wordpress|tumblr|:\s*[0-9]+:\s*(//|\*|/\*)' || echo "rebrand: no visible Postiz left"
