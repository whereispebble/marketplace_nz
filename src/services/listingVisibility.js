export const SOLD_LISTING_VISIBILITY_MS = 24 * 60 * 60 * 1000

/** Sold listings remain in marketplace results for exactly 24 hours. */
export function isMarketplaceListingVisible(vehicle, now = Date.now()) {
  if (vehicle?.status !== 'sold') return true
  const soldAt = new Date(vehicle.sold_at || vehicle.soldAt || '').getTime()
  return Number.isFinite(soldAt) && soldAt <= now && now - soldAt < SOLD_LISTING_VISIBILITY_MS
}
