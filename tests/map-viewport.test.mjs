import test from 'node:test'
import assert from 'node:assert/strict'
import { hasNzCoordinates } from '../src/services/mapViewport.js'

test('map frames New Zealand listings and rejects overseas or missing coordinates', () => {
  for (const point of [
    { lat: -36.85, lng: 174.76 },
    { lat: '-43.53', lng: '172.63' },
    { lat: -46.41, lng: 168.35 },
  ]) assert.equal(hasNzCoordinates(point), true)
  for (const point of [null, {}, { lat: 0, lng: 0 },
    { lat: 40.42, lng: -3.7 }, { lat: -33.87, lng: 151.21 },
    { lat: '', lng: 174 }, { lat: -41, lng: null },
  ]) assert.equal(hasNzCoordinates(point), false)
})
