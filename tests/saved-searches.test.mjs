import test from 'node:test'
import assert from 'node:assert/strict'
import { PGlite } from '@electric-sql/pglite'
import { readFile } from 'node:fs/promises'
import { getSavedSearchesError } from '../src/services/savedSearches.js'

test('missing saved-search table gets a truthful non-blocking message', () => {
  assert.match(getSavedSearchesError({ code: 'PGRST205' }), /temporarily unavailable/)
  assert.doesNotMatch(getSavedSearchesError({ code: 'PGRST205' }), /reload before saving/)
  assert.match(getSavedSearchesError({ code: '42501' }, 'save'), /Could not save/)
})

test('saved-search migration is repeatable and keeps accounts isolated', async () => {
  const db = new PGlite()
  try {
    await db.exec(`
      create role anon; create role authenticated;
      create schema auth;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$
        select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
      $$;
      grant usage on schema public, auth to anon, authenticated;
    `)
    const migration = await readFile(new URL('../supabase/2026-09-17-saved-searches.sql', import.meta.url), 'utf8')
    await db.exec(migration)
    await db.exec(migration)
    const first = '10000000-0000-4000-8000-000000000001'
    const second = '10000000-0000-4000-8000-000000000002'
    await db.exec(`insert into auth.users values ('${first}'), ('${second}')`)
    await db.exec(`set role authenticated; set request.jwt.claim.sub='${first}';
      insert into public.saved_searches(user_id, searches) values ('${first}', '[{"name":"mine"}]')`)
    assert.equal((await db.query('select count(*) from public.saved_searches')).rows[0].count, 1)
    await db.exec(`set request.jwt.claim.sub='${second}'`)
    assert.equal((await db.query('select count(*) from public.saved_searches')).rows[0].count, 0)
    await assert.rejects(db.exec(`insert into public.saved_searches(user_id) values ('${first}')`))
  } finally { await db.close() }
})
