import test from 'node:test'
import assert from 'node:assert/strict'
import { searchPlaces, formatPlace, parseCoordinates } from '../src/services/geocoding.js'

const feature = (properties, coordinates = [174.76, -36.85]) => ({ properties: { countrycode: 'NZ', ...properties }, geometry: { coordinates } })
test('the same location search accepts cities, villages, streets and full addresses', async t => {
  t.mock.method(globalThis, 'fetch', async () => ({ ok: true, json: async () => ({ features: [
    feature({ name: 'Auckland', type: 'city' }),
    feature({ name: 'Akaroa', type: 'village' }),
    feature({ name: 'Example Street', type: 'street', city: 'Auckland' }),
    feature({ street: 'Example Street', housenumber: '1/40', type: 'house', city: 'Auckland', postcode: '1010' }),
    feature({ street: 'Invalid', housenumber: '1' }, [null, null]),
    feature({ street: 'Overseas', housenumber: '2', countrycode: 'AU' }),
  ] }) }))
  for (const query of ['Auckland', 'Akaroa', 'Example Street', '1/40 Example Street Auckland 1010']) {
    const places = await searchPlaces(query)
    assert.deepEqual(places.map(place => place.name), ['Auckland', 'Akaroa', 'Example Street', '1/40 Example Street'])
    assert.equal(places[0].isAddress, false)
    assert.equal(places[3].isAddress, true)
    assert.equal(places[3].label, '1/40 Example Street, Auckland, 1010')
    assert.equal(places[3].lat, -36.85)
  }
})
test('address labels retain street, house or unit number, city and postal code', () => {
  const place = formatPlace(feature({ street: 'Queen Street', housenumber: '12A', city: 'Auckland', state: 'Auckland', postcode: '1010' }))
  assert.equal(place.label, '12A Queen Street, Auckland, 1010')
  assert.equal(formatPlace(feature({ street: 'Queen Street', type: 'street' })).name, 'Queen Street')
})

test('New Zealand named places are accepted and foreign results excluded', async t => {
  t.mock.method(globalThis, 'fetch', async url => {
    assert.equal(new URL(url).searchParams.get('countrycode'), 'NZ')
    return { ok: true, json: async () => ({ features: [
      feature({ name: 'Auckland Museum', type: 'museum', city: 'Auckland', country: 'New Zealand' }),
      feature({ name: 'Museo del Prado', type: 'museum', city: 'Madrid', country: 'Spain', countrycode: 'ES' }, [-3.692, 40.414]),
    ] }) }
  })
  const results = await searchPlaces('museum')
  assert.equal(results.length, 1)
  assert.equal(results[0].name, 'Auckland Museum')
  assert.equal(results[0].context, 'Auckland, New Zealand')
})
test('decimal GPS coordinates resolve without network requests and preserve precision', async t => {
  t.mock.method(globalThis, 'fetch', () => { throw new Error('GPS must resolve locally') })
  const [point] = await searchPlaces('-36.848512, 174.763312')
  assert.equal(point.lat, -36.848512)
  assert.equal(point.lng, 174.763312)
  assert.equal(parseCoordinates('0; 0').lat, 0)
  for (const invalid of ['91, 20', '20, -181', '1..2, 3', 'NaN, 1', 'Auckland']) {
    assert.equal(parseCoordinates(invalid), null)
  }
  assert.deepEqual(await searchPlaces('91, 20'), [])
  assert.deepEqual(await searchPlaces('40.414, -3.692'), [])
  assert.deepEqual(await searchPlaces('0, 0'), [])
  assert.equal((await searchPlaces('-43.95, -176.55')).length, 1)
  assert.deepEqual(await searchPlaces(''), [])
})
