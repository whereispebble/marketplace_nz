let mapModules

export function loadMapModules() {
  mapModules ??= Promise.all([import('leaflet'), import('./mapBasemap')])
    .catch(error => { mapModules = undefined; throw error })
  return mapModules
}

export function preloadMap() {
  void loadMapModules().catch(() => {})
}
