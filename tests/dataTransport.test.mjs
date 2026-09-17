import test from 'node:test'
import assert from 'node:assert/strict'
import { createDataFetch } from '../src/services/dataTransport.js'

test('DEV blocks real REST and Storage even with an existing Authorization header', async () => {
 let calls = 0
 const transport = createDataFetch(() => true, async () => { calls++; return new Response('{}') })
 for (const path of ['/rest/v1/products', '/rest/v1/rpc/start_conversation', '/storage/v1/object/avatars/test']) {
   const response = await transport('https://example.supabase.co' + path, { method: 'POST', headers: { Authorization: 'Bearer old-session' } })
   assert.equal(response.status,403)
 }
 assert.equal(calls,0)
})
test('data source switches immediately, and auth logout remains possible', async () => {
 let dev = false
 const calls = []
 const transport = createDataFetch(() => dev, async (url, options) => { calls.push({url,options}); return new Response('{}') })
 assert.equal((await transport('https://example.supabase.co/rest/v1/products')).status,200)
 dev = true
 assert.equal((await transport('https://example.supabase.co/rest/v1/products')).status,403)
 assert.equal((await transport('https://example.supabase.co/auth/v1/logout', {method:'POST'})).status,200)
 assert.equal(calls.length,2)
 assert.ok(calls.every(call => call.options.signal instanceof AbortSignal))
})
