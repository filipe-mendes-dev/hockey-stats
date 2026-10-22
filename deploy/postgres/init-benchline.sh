#!/bin/bash
set -eu

: "${POSTGRES_USER:?POSTGRES_USER is required}"
: "${POSTGRES_DB:?POSTGRES_DB is required}"
: "${BENCHLINE_DB_USER:?BENCHLINE_DB_USER is required}"
: "${BENCHLINE_DB_PASSWORD:?BENCHLINE_DB_PASSWORD is required}"

# The PostgreSQL entrypoint runs this only when initializing an empty data volume.
# psql quotes identifiers and passwords; credentials stay out of command arguments.
psql --set ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<'SQL'
\getenv app_user BENCHLINE_DB_USER
\getenv app_password BENCHLINE_DB_PASSWORD
\getenv app_database POSTGRES_DB

BEGIN;
CREATE ROLE :"app_user" WITH LOGIN PASSWORD :'app_password'
  NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
ALTER DATABASE :"app_database" OWNER TO :"app_user";
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
COMMIT;
SQL
