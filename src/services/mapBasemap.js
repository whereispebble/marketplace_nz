import { setWorkerUrl } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import { maplibreGL } from '@maplibre/maplibre-gl-leaflet'
import 'maplibre-gl/dist/maplibre-gl.css'
import { mapStyleUrl } from './mapConfig'

// Vite bundles the worker locally, including its imports, for production CSP.
setWorkerUrl(workerUrl)

export function addBasemap(map) {
  return maplibreGL({ style: mapStyleUrl }).addTo(map).getMaplibreMap()
}
