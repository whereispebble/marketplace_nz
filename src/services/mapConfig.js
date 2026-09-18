// Standard MapLibre styles keep the basemap independent of listings/geocoding.
export const mapStyleUrl = import.meta.env.VITE_MAP_STYLE_URL?.trim()
  || 'https://tiles.openfreemap.org/styles/positron'
