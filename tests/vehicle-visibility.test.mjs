import test from 'node:test'
import assert from 'node:assert/strict'
import { isMarketplaceListingVisible, SOLD_LISTING_VISIBILITY_MS } from '../src/services/listingVisibility.js'

const now = Date.parse('2026-09-18T12:00:00Z')

test('sold listings remain in marketplace results for less than 24 hours', () => {
  assert.equal(isMarketplaceListingVisible({ status: 'available' }, now), true)
  assert.equal(isMarketplaceListingVisible({ status: 'sold', sold_at: new Date(now - SOLD_LISTING_VISIBILITY_MS + 1).toISOString() }, now), true)
  assert.equal(isMarketplaceListingVisible({ status: 'sold', sold_at: new Date(now - SOLD_LISTING_VISIBILITY_MS).toISOString() }, now), false)
  assert.equal(isMarketplaceListingVisible({ status: 'sold', sold_at: null }, now), false)
})
