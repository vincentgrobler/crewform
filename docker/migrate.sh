#!/bin/sh
# ─────────────────────────────────────────────────────────────────────────────
# CrewForm — Auto-migration script
# Runs all SQL migrations in sorted order against PostgreSQL.
# Environment: PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD
# ─────────────────────────────────────────────────────────────────────────────

set -e

echo "═══════════════════════════════════════════════════"
echo "  CrewForm — Running database migrations"
echo "═══════════════════════════════════════════════════"

# Create a tracking table to avoid re-running migrations
psql -c "
CREATE TABLE IF NOT EXISTS _migrations (
    name TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
" 2>/dev/null

MIGRATION_DIR="/migrations"
APPLIED=0
SKIPPED=0

for f in $(ls "$MIGRATION_DIR"/*.sql 2>/dev/null | sort); do
    filename=$(basename "$f")

    # Check if already applied
    already=$(psql -tAc "SELECT 1 FROM _migrations WHERE name = '$filename'" 2>/dev/null || echo "")
    if [ "$already" = "1" ]; then
        SKIPPED=$((SKIPPED + 1))
        continue
    fi

    echo "  ▸ Applying: $filename"
    psql -f "$f" -v ON_ERROR_STOP=1

    # Record migration
    psql -c "INSERT INTO _migrations (name) VALUES ('$filename')" 2>/dev/null
    APPLIED=$((APPLIED + 1))
done

echo "═══════════════════════════════════════════════════"
echo "  Done! Applied: $APPLIED | Skipped: $SKIPPED"
echo "═══════════════════════════════════════════════════"
