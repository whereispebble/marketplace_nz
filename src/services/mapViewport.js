import { hasCoordinates } from './validation.js'

export const NZ_BOUNDS = [[-47.5, 166], [-34, 179.5]]
export const NZ_CENTER = [-41.2, 172.8]

// Ignore imported/default coordinates outside the marketplace's service area.
export function hasNzCoordinates(point) {
  if (!hasCoordinates(point)) return false
  const lat = Number(point.lat)
  const lng = Number(point.lng)
  return lat >= NZ_BOUNDS[0][0] && lat <= NZ_BOUNDS[1][0]
    && lng >= NZ_BOUNDS[0][1] && lng <= NZ_BOUNDS[1][1]
}
