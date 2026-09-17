import test from 'node:test'
import assert from 'node:assert/strict'
import { PGlite } from '@electric-sql/pglite'
import { readFile } from 'node:fs/promises'
import { assertPublicationSchema, getPublicationErrorMessage } from '../src/services/publicationSchema.js'

test('publication preflight requests schema only and rejects missing columns', async () => {
  const missing = { code: '42703', message: 'column products.lat does not exist' }
  let columns
  const client = { from(table) {
    assert.equal(table, 'products')
    return { select(value) { columns = value; return { limit: async count => {
      assert.equal(count, 0)
      return { error: missing }
    } } } }
  } }
  await assert.rejects(assertPublicationSchema(client), error => error === missing)
  assert.equal(columns, 'lat,lng')
  for (const column of columns.split(',')) {
    const message = getPublicationErrorMessage({ code: 'PGRST204', message: 'Could not find ' + column })
    assert.match(message, /service needs an update/)
    assert.ok(!message.split(/\W+/).includes(column))
  }
  assert.doesNotMatch(getPublicationErrorMessage({ code: '42501', message: 'permission denied' }), /service needs an update/)
  const ready = { from: () => ({ select: () => ({ limit: async () => ({ error: null }) }) }) }
  await assertPublicationSchema(ready)
})

test('simplified locations publish towns without GPS metadata and reject invalid coordinates', async () => {
  const db = new PGlite()
  try {
    await db.exec(`create table public.products(id int primary key, status text, lat numeric, lng numeric);
      insert into public.products values (1,'available',-36.85,174.76);`)
    const migration = await readFile(new URL('../supabase/2026-09-17-simple-location.sql', import.meta.url), 'utf8')
    await db.exec(migration)
    await db.exec(migration)
    const old = (await db.query('select * from public.products where id=1')).rows[0]
    assert.equal(Object.hasOwn(old, 'location_accuracy_m'), false)
    assert.equal(Number(old.lat), -36.85)
    await db.exec(`insert into public.products(id,status) values (2,'draft');`)
    await assert.rejects(db.exec(`update public.products set status='available' where id=2`))
    await db.exec(`update public.products set status='available', lat=-36.85, lng=174.76 where id=2`)
    await assert.rejects(db.exec(`update public.products set lat=91 where id=2`))
    assert.equal((await db.query('select count(*) from public.products')).rows[0].count, 2)
  } finally { await db.close() }
})
