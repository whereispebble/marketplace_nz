export const SAVED_SEARCHES_UNAVAILABLE = 'Saved searches are temporarily unavailable. Your current search still works.'

export function getSavedSearchesError(error, action = 'load') {
  if (['PGRST205', '42P01'].includes(error?.code)) return SAVED_SEARCHES_UNAVAILABLE
  return action === 'save'
    ? 'Could not save this search. Please try again.'
    : 'Saved searches could not load. Please try again.'
}
