import { setWorkerUrl } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import { maplibreGL } from '@maplibre/maplibre-gl-leaflet'
import 'maplibre-gl/dist/maplibre-gl.css'
import { mapStyleUrl } from './mapConfig'

// Vite bundles the worker locally, including its imports, for production CSP.
setWorkerUrl(workerUrl)

export function addBasemap(map) {
  const basemap = maplibreGL({ style: mapStyleUrl }).addTo(map).getMaplibreMap()
  // A provider style may contain its own camera. Leaflet owns the viewport.
  basemap.on('style.load', () => {
    const center = map.getCenter()
    basemap.jumpTo({ center: [center.lng, center.lat], zoom: map.getZoom() - 1 })
  })
  return basemap
}
