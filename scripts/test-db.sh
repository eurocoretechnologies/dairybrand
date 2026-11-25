#!/usr/bin/env bash
# Applies the migrations and seed to a fresh database on a plain Postgres
# server, then runs the access-rule tests. Used in CI and locally.
#
#   DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres scripts/test-db.sh
#
# The target database (default: ksheera_test) is dropped and recreated.
set -euo pipefail

: "${DATABASE_URL:?Set DATABASE_URL to a Postgres server you can create databases on}"
TEST_DB="${TEST_DB:-ksheera_test}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q \
  -c "drop database if exists ${TEST_DB}" \
  -c "create database ${TEST_DB}"

TEST_URL="$(printf '%s' "$DATABASE_URL" | sed -E "s#/[^/?]*(\?|$)#/${TEST_DB}\1#")"
run() { psql "$TEST_URL" -v ON_ERROR_STOP=1 -q -f "$1"; }

run "$ROOT/supabase/tests/supabase_stubs.sql"
for migration in "$ROOT"/supabase/migrations/*.sql; do
  run "$migration"
done
run "$ROOT/supabase/seed.sql"
for test in "$ROOT"/supabase/tests/*_test.sql; do
  run "$test"
done
