#!/usr/bin/env bash
# Applies every migration + seed to a throwaway local Postgres database and runs the RLS / business-rule checks.
# Usage: PGHOST=/tmp PGPORT=5444 PGUSER=postgres supabase/tests/run.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
DB=${DB:-phanet_test}
dropdb --if-exists "$DB"; createdb "$DB"
psql -v ON_ERROR_STOP=1 -q -d "$DB" -f supabase/tests/local-stubs.sql
for f in supabase/migrations/*.sql; do psql -v ON_ERROR_STOP=1 -q -d "$DB" -f "$f"; done
psql -v ON_ERROR_STOP=1 -q -d "$DB" -f supabase/seed.sql
psql -v ON_ERROR_STOP=1 -q -d "$DB" -f supabase/tests/rls.sql
