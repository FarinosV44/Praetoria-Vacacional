/**
 * Generates supabase/setup.sql — a single, fully IDEMPOTENT script that creates
 * the whole schema. Safe to run on an empty database OR one that already has
 * some (or all) migrations applied. Use this in the Supabase SQL Editor when you
 * don't have the CLI / `supabase db push`.
 *
 * Transforms applied to the concatenated migrations:
 *   create type T as enum (...)      -> guarded by pg_type
 *   create table T (                 -> create table if not exists T (
 *   create [unique] index I on       -> ... if not exists I on
 *   create trigger G ... ;           -> guarded by pg_trigger
 *   alter table X add constraint C…; -> guarded by pg_constraint
 * Everything else (functions, RLS, grants, do-blocks, on-conflict inserts) is
 * already re-runnable and passes through untouched.
 *
 *   node scripts/build-setup-sql.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const DIR = "supabase/migrations";
const files = readdirSync(DIR).filter((f) => f.endsWith(".sql")).sort();

let out = `-- =============================================================================
-- Praetoria Vacacional — TODAS las migraciones en un solo archivo (IDEMPOTENTE)
--
-- Uso: Supabase Dashboard -> SQL Editor -> New query -> pega TODO esto -> Run.
-- Equivalente a \`supabase db push\`. SEGURO de ejecutar varias veces y sobre una
-- base de datos parcialmente migrada: cada tipo/tabla/índice/trigger/constraint
-- se crea solo si falta.
--
-- NO editar a mano: se genera con  node scripts/build-setup-sql.mjs
-- =============================================================================

`;

function idempotent(sql) {
  // create type NAME as enum (...);   (single line)
  sql = sql.replace(
    /^create type (\w+) as enum \(([^;]*)\);/gim,
    (_m, name, body) =>
      `do $$ begin\n  if not exists (select 1 from pg_type where typname = '${name}') then\n    create type ${name} as enum (${body.trim()});\n  end if;\nend $$;`,
  );

  // create table NAME (        -> add "if not exists"
  sql = sql.replace(/^create table (?!if not exists)(\w+)\s*\(/gim, "create table if not exists $1 (");

  // alter table … add column NAME …  -> add column if not exists NAME …
  // (per-clause, so a multi-column ALTER is safe even if some columns exist)
  sql = sql.replace(/\badd column (?!if not exists)(\w+)/gi, "add column if not exists $1");

  // create [unique] index NAME on ...  -> add "if not exists"
  sql = sql.replace(
    /^create (unique )?index (?!if not exists)(\w+)\s+on/gim,
    (_m, uniq, name) => `create ${uniq ?? ""}index if not exists ${name} on`,
  );

  // create trigger NAME ... ;   (may span lines)  -> guard by pg_trigger
  sql = sql.replace(
    /^create trigger (\w+)([\s\S]*?);/gim,
    (_m, name, rest) =>
      `do $$ begin\n  if not exists (select 1 from pg_trigger where tgname = '${name}' and not tgisinternal) then\n    create trigger ${name}${rest};\n  end if;\nend $$;`,
  );

  // alter table X ... add constraint C ... ;  (spans lines) -> guard by pg_constraint
  sql = sql.replace(
    /^alter table (\w+)\s+add constraint (\w+)([\s\S]*?);/gim,
    (_m, table, cons, rest) =>
      `do $$ begin\n  if not exists (select 1 from pg_constraint where conname = '${cons}') then\n    alter table ${table} add constraint ${cons}${rest};\n  end if;\nend $$;`,
  );

  return sql;
}

for (const f of files) {
  const raw = readFileSync(join(DIR, f), "utf8");
  out += `\n-- ----------------------------------------------------------------------------\n-- ${f}\n-- ----------------------------------------------------------------------------\n`;
  out += idempotent(raw).trimEnd() + "\n";
}

writeFileSync("supabase/apply-all-migrations.sql", out);
console.log(`supabase/apply-all-migrations.sql written (idempotent) (${files.length} migrations, ${out.length} bytes)`);
