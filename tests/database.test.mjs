import { PGlite } from '@electric-sql/pglite'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import assert from 'node:assert/strict'

const A = '10000000-0000-4000-8000-000000000001'
const B = '10000000-0000-4000-8000-000000000002'
const C = '10000000-0000-4000-8000-000000000003'
const P = '20000000-0000-4000-8000-000000000001'

// Real PostgreSQL engine; only Supabase-managed auth/storage infrastructure is stubbed.
// This tests the repository SQL, not the configuration of the deployed Supabase project.
test('database isolation, conversation integrity and atomic image updates', async t => {
 const db = new PGlite()
 try {
 await db.exec(`
 create role anon; create role authenticated;
 create schema auth; create schema storage;
 create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
 create table storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
 create table storage.objects(id uuid primary key default gen_random_uuid(), bucket_id text, name text);
 create function storage.foldername(text) returns text[] language sql immutable as $$ select string_to_array($1, '/') $$;
 grant usage on schema public, auth, storage to anon, authenticated;
 alter default privileges in schema public grant all on tables to anon, authenticated;
 `)
 for (const name of ['swapy-persistence.sql', '2026-08-extra-filters.sql', '2026-08-user-reports.sql', '2026-09-17-schema-compat.sql', '2026-09-security-and-integrity.sql', '2026-09-username-uniqueness.sql', '2026-09-17-launch-hardening.sql', '2026-09-17-location-search.sql', '2026-09-17-publication-location.sql', '2026-09-17-simple-location.sql', '2026-09-17-messaging.sql', '2026-09-17-chat-completion.sql']) {
   try { await db.exec(await readFile(new URL('../supabase/' + name, import.meta.url), 'utf8')) }
   catch (error) { throw new Error(name + ': ' + error.message) }
 }
 await db.exec(await readFile(new URL('../supabase/2026-09-17-launch-hardening.sql', import.meta.url), 'utf8'))
 await db.exec(await readFile(new URL('../supabase/2026-09-17-location-search.sql', import.meta.url), 'utf8'))
 await db.exec(await readFile(new URL('../supabase/2026-09-17-simple-location.sql', import.meta.url), 'utf8'))
 await db.exec('alter table public.messages drop column read_at')
 await db.exec(await readFile(new URL('../supabase/2026-09-17-messaging.sql', import.meta.url), 'utf8'))
 assert.equal((await db.query(`select count(*) from information_schema.columns where table_schema='public' and table_name='messages' and column_name='read_at'`)).rows[0].count, 1)
 const alignmentSql = await readFile(new URL('../supabase/2026-09-17-remote-schema-alignment.sql', import.meta.url), 'utf8')
 await db.exec(alignmentSql)
 await db.exec(alignmentSql)
 await db.exec(`insert into auth.users(id,email,raw_user_meta_data) values
 ('${A}','buyer@local.test','{"username":"buyer"}'),('${B}','seller@local.test','{"username":"seller"}'),('${C}','outsider@local.test','{"username":"outsider"}');
 insert into public.products(id,user_id,title,status,price,make,model,location,lat,lng,image,images,location_confirmed,location_source)
 values ('${P}','${B}','Test vehicle','available',15000,'Toyota','Hiace','Auckland',-36.85,174.76,'https://example.test/one.jpg','["https://example.test/one.jpg"]',true,'map');`)
 async function asUser(id, fn) {
   await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub', '${id}', false)`)
   try { return await fn() } finally { await db.exec('reset role') }
 }
 await t.test('public profiles exclude private contact fields', async () => {
   await db.exec('set role anon')
   try {
    assert.equal((await db.query('select * from public.public_profiles')).rows.length,3)
    await assert.rejects(db.query('select email from public.public_profiles'))
    await assert.rejects(db.query('select * from public.profiles'))
   } finally { await db.exec('reset role') }
 })
 await t.test('a user cannot read another private profile or forge reputation', () => asUser(A, async () => {
   assert.deepEqual((await db.query(`select id from public.profiles where id = '${B}'`)).rows,[])
   await assert.rejects(db.query(`update public.profiles set rating = 5 where id = '${A}'`))
   await assert.rejects(db.query(`update public.profiles set email = 'other@local.test' where id = '${A}'`))
   assert.equal((await db.query(`update public.profiles set bio='Hello' where id='${A}' returning id`)).rows.length,1)
 }))
 let chat
 await t.test('opening contact is idempotent and verifies the seller', () => asUser(A, async () => {
   await assert.rejects(db.query(`select * from public.start_conversation('${P}','${C}')`))
   chat = (await db.query(`select * from public.start_conversation('${P}','${B}')`)).rows[0]
   assert.equal(chat.product_id, P)
   assert.equal((await db.query(`select * from public.start_conversation('${P}','${B}')`)).rows[0].id,chat.id)
   await assert.rejects(db.query(`update public.chats set seller_id='${C}' where id='${chat.id}'`))
 }))
 await t.test('conversations require a listing', async () => {
   await asUser(A, async () => assert.rejects(db.query(`select * from public.start_conversation(null,'${B}')`)))
 })
 let message
 await t.test('only participants can read/send; sender and content cannot be rewritten', async () => {
   message = await asUser(A,async () => (await db.query(`insert into public.messages(chat_id,sender_id,content) values ('${chat.id}','${A}','Hello') returning *`)).rows[0])
   await asUser(C,async () => {
     assert.equal((await db.query('select * from public.messages')).rows.length,0)
     assert.equal((await db.query('select * from public.chats')).rows.length,0)
     await assert.rejects(db.query(`insert into public.messages(chat_id,sender_id,content) values ('${chat.id}','${C}','Intrusion')`))
   })
   await asUser(B,async () => {
     await assert.rejects(db.query(`update public.messages set content='Changed' where id='${message.id}'`))
     assert.equal((await db.query(`update public.messages set read_at=now() where id='${message.id}' returning id`)).rows.length,1)
     await assert.rejects(db.query(`insert into public.messages(chat_id,sender_id,content) values ('${chat.id}','${A}','Forged')`))
   })
 })
 await t.test('offers persist, only seller decides, duplicate pending offers are rejected', async () => {
   const offer = await asUser(A,async () => (await db.query(`insert into public.offers(chat_id,buyer_id,amount) values ('${chat.id}','${A}',14000) returning *`)).rows[0])
   await asUser(A,async () => {
    await assert.rejects(db.query(`insert into public.offers(chat_id,buyer_id,amount) values ('${chat.id}','${A}',13000)`))
    assert.equal((await db.query(`update public.offers set status='accepted' where id='${offer.id}' returning id`)).rows.length,0)
   })
   await asUser(B,async () => {
     await assert.rejects(db.query(`update public.offers set amount=1 where id='${offer.id}'`))
     assert.equal((await db.query(`update public.offers set status='accepted' where id='${offer.id}' returning status`)).rows[0].status,'accepted')
   })
   await asUser(C,async () => assert.equal((await db.query('select * from public.offers')).rows.length,0))
 })
 await t.test('only seller completes sale and participants review each other once', async () => {
   await asUser(A, async () => assert.rejects(db.query(`select * from public.mark_listing_sold('${chat.id}')`)))
   await asUser(B, async () => assert.ok((await db.query(`select * from public.mark_listing_sold('${chat.id}')`)).rows[0].sold_at))
   await asUser(A, async () => {
     assert.equal((await db.query(`insert into public.reviews(chat_id,product_id,reviewer_id,reviewed_user_id,rating,comment) values ('${chat.id}','${P}','${A}','${B}',5,'Great seller') returning id`)).rows.length,1)
     await assert.rejects(db.query(`insert into public.reviews(chat_id,product_id,reviewer_id,reviewed_user_id,rating) values ('${chat.id}','${P}','${A}','${B}',4)`))
   })
   await asUser(B, async () => assert.equal((await db.query(`insert into public.reviews(chat_id,product_id,reviewer_id,reviewed_user_id,rating) values ('${chat.id}','${P}','${B}','${A}',4) returning id`)).rows.length,1))
   await asUser(C, async () => assert.rejects(db.query(`insert into public.reviews(chat_id,product_id,reviewer_id,reviewed_user_id,rating) values ('${chat.id}','${P}','${C}','${B}',5)`)))
   assert.equal((await db.query(`select total_sales from public.profiles where id='${B}'`)).rows[0].total_sales,1)
 })
 await t.test('publishing requires resolved coordinates; drafts can remain incomplete', async () => {
   await asUser(B, async () => {
     await db.query(`update public.products set location_confirmed=false where id='${P}'`)
     await db.query(`update public.products set location_source=null where id='${P}'`)
     await assert.rejects(db.query(`update public.products set lat=null, lng=null where id='${P}'`))
     await db.query(`update public.products set location_source='address' where id='${P}'`)
     const draft = (await db.query(`insert into public.products(user_id,title,status) values ('${B}','Draft','draft') returning id`)).rows[0]
     assert.ok(draft.id)
     await assert.rejects(db.query(`update public.products set status='available' where id='${draft.id}'`))
   })
 })
 await t.test('saved searches and support requests cannot expose another account', async () => {
   await asUser(A, async () => {
     await db.query(`insert into public.saved_searches(user_id, searches) values ('${A}', '[{"name":"private"}]')`)
     await db.query(`insert into public.support_requests(user_id,name,email,topic,message) values ('${A}','Buyer','buyer@local.test','general','Help')`)
     await assert.rejects(db.query(`insert into public.support_requests(user_id,name,email,topic,message) values ('${B}','Buyer','buyer@local.test','general','Forged')`))
   })
   await asUser(C, async () => {
     assert.equal((await db.query('select * from public.saved_searches')).rows.length, 0)
     await assert.rejects(db.query('select * from public.support_requests'))
   })
 })
 await t.test('favorites are private and reject nonexistent or mock IDs', async () => {
   await asUser(A, async () => {
     await db.query(`insert into public.favorites(user_id,product_id) values ('${A}','${P}')`)
     await assert.rejects(db.query(`insert into public.favorites(user_id,product_id) values ('${A}','1')`))
     await assert.rejects(db.query(`insert into public.favorites(user_id,product_id) values ('${A}','20000000-0000-4000-8000-000000000099')`))
   })
   await asUser(C, async () => assert.equal((await db.query('select * from public.favorites')).rows.length, 0))
 })
 await t.test('image updates are atomic and private drafts stay private', async () => {
   await asUser(B,async () => {
     await assert.rejects(db.query(`update public.products set images='["javascript:bad"]', image='javascript:bad' where id='${P}'`))
     assert.equal((await db.query(`select image_url from public.product_images where product_id='${P}'`)).rows[0].image_url,'https://example.test/one.jpg')
     await db.query(`update public.products set images='["https://example.test/two.jpg"]', image='https://example.test/two.jpg', status='paused' where id='${P}'`)
     assert.equal((await db.query(`select image_url from public.product_images where product_id='${P}'`)).rows[0].image_url,'https://example.test/two.jpg')
     await assert.rejects(db.query(`update public.products set lat=null where id='${P}'`))
     assert.equal((await db.query(`select total_sales from public.profiles where id='${B}'`)).rows[0].total_sales,0)
   })
   await asUser(A,async () => {
     assert.equal((await db.query(`select * from public.products where id='${P}'`)).rows.length,0)
     await assert.rejects(db.query(`select * from public.start_conversation('${P}','${B}')`))
   })
 })
 await t.test('deleting a listing clears dependants but preserves its conversation history', async () => {
   await asUser(B,async () => assert.equal((await db.query(`delete from public.products where id='${P}' returning id`)).rows[0].id,P))
   assert.equal((await db.query(`select count(*) from public.product_images where product_id='${P}'`)).rows[0].count,0)
   assert.equal((await db.query(`select product_id from public.chats where id='${chat.id}'`)).rows[0].product_id,null)
   assert.ok((await db.query(`select count(*) from public.messages where chat_id='${chat.id}'`)).rows[0].count>0)
   assert.equal((await db.query(`select count(*) from public.reviews where chat_id='${chat.id}' and product_id is not null`)).rows[0].count,0)
 })
 } finally { await db.close() }
})
