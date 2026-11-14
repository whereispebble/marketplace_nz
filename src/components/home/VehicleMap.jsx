/**
 * Mapa de resultados.
 *
 * Carga Leaflet bajo demanda (no entra en el paquete inicial) y pinta un
 * marcador con el precio por cada anuncio. Si hay una ubicacion elegida en los
 * filtros, centra el encuadre en ella y en los anuncios mas cercanos.
 */

import { useEffect, useRef, useState } from 'react'
import { distanceKm } from '../../services/vehicleFilters'
import { hasNzCoordinates, NZ_BOUNDS, NZ_CENTER } from '../../services/mapViewport'
import { loadMapModules } from '../../services/mapLoader'

import 'leaflet/dist/leaflet.css'
let leaflet

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]))
}

export default function VehicleMap({ vehicles, focusPoint }) {
  const mapRef = useRef(null)
  const leafletMapRef = useRef(null)
  const markerLayerRef = useRef(null)
  const [mapError, setMapError] = useState('')
  const [mapReady, setMapReady] = useState(false)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let ignore = false
    let loadTimer
    let resizeObserver

    async function setupMap() {
      try {
        const [leafletModule, { addBasemap }] = await loadMapModules()
        const L = leafletModule.default
        leaflet = L
        if (ignore || !mapRef.current || leafletMapRef.current) return

        const map = L.map(mapRef.current, {
          center: NZ_CENTER,
          zoom: 5,
          minZoom: 5,
          maxZoom: 19,
          maxBounds: NZ_BOUNDS,
          maxBoundsViscosity: 1,
          // La rueda hace scroll de la pagina, no zoom del mapa: encadenaba
          // cargas de tiles hasta bloquear el render. Se usan los botones +/-,
          // el pinch en movil o ctrl + rueda.
          scrollWheelZoom: false,
          zoomControl: true,
          zoomAnimation: false,
          fadeAnimation: false,
        })
        leafletMapRef.current = map

        map.getContainer().addEventListener('wheel', event => {
          if (!event.ctrlKey && !event.metaKey) return
          event.preventDefault()
          map.setZoom(map.getZoom() + (event.deltaY < 0 ? 1 : -1))
        }, { passive: false })

        const basemap = addBasemap(map)
        const showError = () => {
          if (!ignore) setMapError('Map unavailable. Retry or use the list view to browse vehicles.')
        }
        loadTimer = setTimeout(showError, 20000)
        basemap.on('error', showError)
        basemap.on('idle', () => {
          clearTimeout(loadTimer)
          if (!ignore && basemap.areTilesLoaded()) setMapError('')
        })
        basemap.on('webglcontextlost', showError)
        resizeObserver = new ResizeObserver(() => map.invalidateSize())
        resizeObserver.observe(mapRef.current)

        markerLayerRef.current = L.layerGroup().addTo(map)
        leafletMapRef.current = map
        setMapReady(true)
        if (!ignore) map.invalidateSize()
      } catch {
        if (!ignore) setMapError('Map service could not load. Check your connection and try again.')
      }
    }

    setupMap()

    return () => {
      ignore = true
      clearTimeout(loadTimer)
      resizeObserver?.disconnect()
      leafletMapRef.current?.remove()
      leafletMapRef.current = null
      markerLayerRef.current = null
      setMapReady(false)
    }
  }, [retry])

  const focusLat = Number(focusPoint?.lat)
  const focusLng = Number(focusPoint?.lng)
  const hasFocus = hasNzCoordinates(focusPoint)

  useEffect(() => {
    const L = leaflet
    const map = leafletMapRef.current
    const layer = markerLayerRef.current
    if (!mapReady || !L || !map || !layer) return

    layer.clearLayers()
    const bounds = []

    vehicles.forEach(vehicle => {
      if (!hasNzCoordinates(vehicle)) return
      const marker = L.marker([vehicle.lat, vehicle.lng], {
        icon: L.divIcon({
          className: 'swapy-map-marker',
          html: `<span>NZ${Math.round(Number(vehicle.price || 0) / 1000)}k</span>`,
          iconSize: [62, 38],
          iconAnchor: [31, 38],
        }),
      }).addTo(layer)

      const image = vehicle.image || 'https://placehold.co/640x480/f1ede5/171717?text=Moonwalk'
      const price = Number(vehicle.price || 0).toLocaleString('en-NZ')
      const meta = [vehicle.location || 'New Zealand', vehicle.model].filter(Boolean).join(' · ')

      marker.bindPopup(`
        <div class="map-popup">
          <img class="map-popup-image" src="${escapeHtml(image)}" alt="" />
          <div class="map-popup-body">
            <strong>${escapeHtml(vehicle.title)}</strong>
            <p class="map-popup-price">NZ$${price}</p>
            <p class="map-popup-meta">${escapeHtml(meta)}</p>
            <a href="/product/${encodeURIComponent(vehicle.id)}">View listing</a>
          </div>
        </div>
      `, { minWidth: 220, maxWidth: 240 })
      bounds.push([vehicle.lat, vehicle.lng])
    })

    if (hasFocus) {
      const focus = { lat: focusLat, lng: focusLng }

      L.circleMarker([focusLat, focusLng], {
        className: 'swapy-map-focus',
        radius: 9,
        weight: 3,
        color: '#14bc7d',
        fillColor: '#14bc7d',
        fillOpacity: 0.25,
      })
        .addTo(layer)
        .bindTooltip(escapeHtml(focusPoint.label || 'Selected location'), { direction: 'top', offset: [0, -10] })

      // El encuadre cubre la ubicacion elegida y los anuncios mas cercanos, no
      // todo el pais: asi se ve el sitio buscado y algo de oferta alrededor.
      const nearest = vehicles
        .filter(hasNzCoordinates)
        .map(vehicle => ({ vehicle, distance: distanceKm(focus, vehicle) }))
        .filter(entry => entry.distance !== null)
        .sort((first, second) => first.distance - second.distance)
        .slice(0, 5)
        .map(entry => [entry.vehicle.lat, entry.vehicle.lng])

      map.fitBounds([[focusLat, focusLng], ...nearest], { padding: [40, 40], maxZoom: 11, animate: false })
      return
    }

    if (bounds.length) {
      map.fitBounds(bounds, { padding: [34, 34], maxZoom: 8, animate: false })
    } else {
      map.fitBounds(NZ_BOUNDS, { padding: [12, 12], animate: false })
    }
  }, [vehicles, mapReady, hasFocus, focusLat, focusLng, focusPoint?.label])

  useEffect(() => {
    const map = leafletMapRef.current
    if (!mapReady || !map) return
    const timer = setTimeout(() => map.invalidateSize(), 80)
    return () => clearTimeout(timer)
  }, [mapReady, vehicles.length])

  return (
    <section className="map-layout">
      <div className="street-map panel">
        <div className="street-map-canvas" ref={mapRef} aria-label="Interactive New Zealand vehicle map" />
        {mapError && <div className="map-error" role="status">
          {mapError}
          <button type="button" onClick={() => { setMapError(''); setRetry(value => value + 1) }}>Retry map</button>
        </div>}
      </div>
    </section>
  )
}
