import { loadEnv } from 'vite'
const env = loadEnv('production', process.cwd(), '')
const base = env.VITE_SUPABASE_URL?.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
const key = env.VITE_SUPABASE_KEY || env.VITE_SUPABASE_ANON_KEY
if (!base || !key) throw new Error('Missing public Supabase configuration')
if (!key.startsWith('sb_publishable_')) {
 const payload = JSON.parse(Buffer.from(key.split('.')[1] || '', 'base64url').toString())
 if (payload.role !== 'anon') throw new Error('Refusing to audit with a privileged key')
}
for (const [label, path] of [
 ['Public seller view', 'public_profiles?select=id,username&limit=0'],
 ['Anonymous email exposure', 'profiles?select=email&limit=1'],
 ['Anonymous private chats', 'chats?select=id,product_id,buyer_id,seller_id,created_at,updated_at&limit=1'],
 ['Anonymous private messages', 'messages?select=id,chat_id,sender_id,content,read_at,created_at&limit=1'],
 ['Anonymous private favorites', 'favorites?select=id&limit=1'],
 ['Saved searches schema', 'saved_searches?select=user_id,searches&limit=0'],
 ['Offers schema', 'offers?select=id&limit=0'],
]) {
 const response = await fetch(`${base}/rest/v1/${path}`, { headers: { apikey: key, Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(15000) })
 const data = await response.json()
 console.log(JSON.stringify({ check: label, status: response.status, returnedRows: Array.isArray(data) ? data.length : undefined, errorCode: data?.code }))
}
import { hasCoordinates } from '../src/services/validation.js'
const listingsResponse = await fetch(`${base}/rest/v1/products?select=lat,lng,status&status=in.(available,reserved,sold)&limit=1000`, { headers: { apikey: key, Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(15000) })
const listings = await listingsResponse.json()
if (Array.isArray(listings)) console.log(JSON.stringify({ check: 'Public listing map readiness (up to 1000 rows)', sampled: listings.length, missingOrInvalidCoordinates: listings.filter(row => !hasCoordinates(row)).length }))

const rpcResponse = await fetch(`${base}/rest/v1/rpc/start_conversation`, {
 method: 'POST',
 headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
 body: JSON.stringify({ p_product_id: null, p_seller_id: null }),
 signal: AbortSignal.timeout(15000),
})
const rpcData = await rpcResponse.json()
console.log(JSON.stringify({ check: 'Conversation RPC schema', status: rpcResponse.status, errorCode: rpcData?.code }))

for (const [table, columns] of Object.entries({
 chats: ['id', 'product_id', 'buyer_id', 'seller_id', 'created_at', 'updated_at'],
 messages: ['id', 'chat_id', 'sender_id', 'content', 'read_at', 'created_at'],
})) {
 for (const column of columns) {
  const response = await fetch(`${base}/rest/v1/${table}?select=${column}&limit=0`, {
   headers: { apikey: key, Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(15000),
  })
  const data = await response.json()
  console.log(JSON.stringify({ check: `${table}.${column}`, status: response.status, errorCode: data?.code }))
 }
}
