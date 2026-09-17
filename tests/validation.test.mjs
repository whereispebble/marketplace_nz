import test from 'node:test'
import assert from 'node:assert/strict'
import { hasCoordinates, isUuid, safeInternalPath } from '../src/services/validation.js'
import { isPublicSupabaseKey, isSecureServiceUrl } from '../src/services/runtimeConfig.js'

test('map accepts numeric coordinates including zero, rejects missing and out-of-range values', () => {
 for (const point of [null, {}, { lat:null,lng:null }, {lat:'',lng:2}, {lat:91,lng:0}, {lat:0,lng:181}, {lat:'bad',lng:0}]) assert.equal(hasCoordinates(point),false)
 for (const point of [{lat:0,lng:0},{lat:'-36.85',lng:'174.76'}]) assert.equal(hasCoordinates(point),true)
})
test('redirects preserve conversation parameters and reject external destinations', () => {
 for (const path of ['https://evil.test','//evil.test','/\\evil.test','/\nevil.test',null]) assert.equal(safeInternalPath(path),'/')
 assert.equal(safeInternalPath('/chats?productId=123'),'/chats?productId=123')
})
test('production rejects private keys and insecure service endpoints', () => {
 const jwt = role => 'a.' + Buffer.from(JSON.stringify({role})).toString('base64url') + '.b'
 assert.equal(isPublicSupabaseKey(jwt('service_role')),false)
 assert.equal(isPublicSupabaseKey('sb_secret_test'),false)
 assert.equal(isPublicSupabaseKey(jwt('anon')),true)
 assert.equal(isSecureServiceUrl('http://project.supabase.co'),false)
 assert.equal(isSecureServiceUrl('https://project.supabase.co'),true)
 assert.equal(isSecureServiceUrl('https://user:password@project.supabase.co'),false)
})
test('real routes reject numeric mock IDs and malformed identifiers', () => {
 assert.equal(isUuid('1'),false)
 assert.equal(isUuid('seller'),false)
 assert.equal(isUuid('10000000-0000-4000-8000-000000000001'),true)
})
