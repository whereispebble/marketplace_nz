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
