/**
 * Mapa de resultados.
 *
 * Carga Leaflet bajo demanda (no entra en el paquete inicial) y pinta un
 * marcador con el precio por cada anuncio. Si hay una ubicacion elegida en los
 * filtros, centra el encuadre en ella y en los anuncios mas cercanos.
 */

import { useEffect, useRef, useState } from 'react'
import { distanceKm } from '../../services/vehicleFilters'
import { hasCoordinates } from '../../services/validation'

import 'leaflet/dist/leaflet.css'
let leafletPromise
let leaflet
function loadLeaflet() {
  if (!leafletPromise) {
    leafletPromise = import('leaflet').then(module => {
      leaflet = module.default
      return leaflet
    }).catch(error => { leafletPromise = null; throw error })
  }
  return leafletPromise
}

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

  useEffect(() => {
    let ignore = false

    async function setupMap() {
      try {
        const L = await loadLeaflet()
        if (ignore || !mapRef.current || leafletMapRef.current) return

        const map = L.map(mapRef.current, {
          center: [-41.2, 172.8],
          zoom: 5,
          minZoom: 5,
          maxZoom: 19,
          // La rueda hace scroll de la pagina, no zoom del mapa: encadenaba
          // cargas de tiles hasta bloquear el render. Se usan los botones +/-,
          // el pinch en movil o ctrl + rueda.
          scrollWheelZoom: false,
          zoomControl: true,
        })

        map.getContainer().addEventListener('wheel', event => {
          if (!event.ctrlKey && !event.metaKey) return
          event.preventDefault()
          map.setZoom(map.getZoom() + (event.deltaY < 0 ? 1 : -1))
        }, { passive: false })

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map)

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
      leafletMapRef.current?.remove()
      leafletMapRef.current = null
      markerLayerRef.current = null
      setMapReady(false)
    }
  }, [])

  const focusLat = Number(focusPoint?.lat)
  const focusLng = Number(focusPoint?.lng)
  const hasFocus = hasCoordinates(focusPoint)

  useEffect(() => {
    const L = leaflet
    const map = leafletMapRef.current
    const layer = markerLayerRef.current
    if (!mapReady || !L || !map || !layer) return

    layer.clearLayers()
    const bounds = []

    vehicles.forEach(vehicle => {
      if (!hasCoordinates(vehicle)) return
      const marker = L.marker([vehicle.lat, vehicle.lng], {
        icon: L.divIcon({
          className: 'swapy-map-marker',
          html: `<span>NZ${Math.round(Number(vehicle.price || 0) / 1000)}k</span>`,
          iconSize: [62, 38],
          iconAnchor: [31, 38],
        }),
      }).addTo(layer)

      const image = vehicle.image || 'https://placehold.co/640x480/f1ede5/171717?text=Swapy'
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
        .filter(hasCoordinates)
        .map(vehicle => ({ vehicle, distance: distanceKm(focus, vehicle) }))
        .filter(entry => entry.distance !== null)
        .sort((first, second) => first.distance - second.distance)
        .slice(0, 5)
        .map(entry => [entry.vehicle.lat, entry.vehicle.lng])

      map.fitBounds([[focusLat, focusLng], ...nearest], { padding: [40, 40], maxZoom: 11 })
      return
    }

    if (bounds.length) {
      map.fitBounds(bounds, { padding: [34, 34], maxZoom: 8 })
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
        {mapError && <div className="map-error">{mapError}</div>}
      </div>
    </section>
  )
}
