import { hasCoordinates } from './validation.js'

export function hasCompleteListing(listing) {
  return [listing.title, listing.make, listing.model, listing.vehicleType, listing.condition, listing.location]
    .every(value => typeof value === 'string' && value.trim().length > 0)
    && Number(listing.price) > 0
    && hasCoordinates(listing)
    && Array.isArray(listing.images)
    && listing.images.length >= 1
    && listing.images.length <= 5
}

const locationColumns = ['lat', 'lng']
const unavailableMessage = 'Publishing is temporarily unavailable because the service needs an update. Your form is preserved. Please try again later.'

export function getPublicationErrorMessage(error) {
  const missingColumn = ['42703', 'PGRST204'].includes(error?.code)
    && locationColumns.some(column => String(error?.message || '').includes(column))
  if (missingColumn) return unavailableMessage
  return 'Could not save the listing. Your form is preserved; please try again. Any reserved draft is available in your profile.'
}

// Check before creating a draft or uploading files. Never retry without coordinates.
export async function assertPublicationSchema(client) {
  const { error } = await client.from('products').select(locationColumns.join(',')).limit(0)
  if (error) throw error
}
