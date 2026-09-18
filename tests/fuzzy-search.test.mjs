import test from 'node:test'
import assert from 'node:assert/strict'
import { fuzzyIncludes, fuzzyMatchScore, filterVehicles } from '../src/services/vehicleFilters.js'
import { DEFAULT_FILTERS } from '../src/constants/filters.js'

test('vehicle search tolerates swapped, omitted and mistyped letters', () => {
  const toyotaHiace = '2018 Toyota Hiace certified camper Auckland'
  assert.equal(fuzzyIncludes(toyotaHiace, 'totoya'), true)
  assert.equal(fuzzyIncludes(toyotaHiace, 'toyota haic'), true)
  assert.equal(fuzzyIncludes(toyotaHiace, 'toyta hiace'), true)
  assert.equal(fuzzyIncludes(toyotaHiace, 'Mercedes Sprinter'), false)
})

test('closer text matches receive a better relevance score', () => {
  assert.ok(fuzzyMatchScore('Toyota Hiace', 'toyota haic') < fuzzyMatchScore('Toyota Highlander', 'toyota haic'))
})

test('misspelled searches return the intended marketplace listing', () => {
  const vehicles = [
    { id: 'hiace', status: 'available', make: 'Toyota', model: 'Hiace', title: 'Toyota Hiace Camper' },
    { id: 'sprinter', status: 'available', make: 'Mercedes', model: 'Sprinter', title: 'Mercedes Sprinter Camper' },
  ]
  const results = filterVehicles(vehicles, { ...DEFAULT_FILTERS, search: 'toyota haic' })
  assert.deepEqual(results.map(vehicle => vehicle.id), ['hiace'])
})
