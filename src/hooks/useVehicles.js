/**
 * Carga de anuncios para la portada.
 *
 * Trae de Supabase los anuncios que el visitante puede ver (las politicas RLS
 * ya descartan los borradores ajenos). Los anuncios de ejemplo solo se anaden
 * cuando esta activa la sesion de prueba: con una cuenta real la lista es
 * exactamente lo que hay en la base de datos, aunque este vacia.
 */

import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import { DEV_SESSION_EVENT, isDevSessionActive } from '../services/devAuth'
import { loadMockVehicles } from '../services/devData'

/**
 * @returns {{vehicles: object[], loading: boolean, error: string}}
 */
export function useVehicles() {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  // Cambia al entrar o salir de la sesion de prueba y fuerza recargar la lista,
  // porque con ella entran o salen los anuncios de ejemplo.
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    const reload = () => setReloadToken(current => current + 1)
    window.addEventListener(DEV_SESSION_EVENT, reload)
    return () => window.removeEventListener(DEV_SESSION_EVENT, reload)
  }, [])

  useEffect(() => {
    // ignore evita escribir en el estado si el componente ya se desmonto.
    let ignore = false
    // Discard the previous data source before fetching the next one.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    setVehicles([])

    async function loadVehicles() {
      // Una sesión DEV no consulta ni mezcla anuncios reales.
      if (isDevSessionActive()) {
        setError('')
        const mocks = await loadMockVehicles()
        if (ignore) return
        setVehicles(mocks)
        setLoading(false)
        return
      }

      const { data, error: queryError } = await supabase
        .from('products')
        .select('*')
        .in('status', ['available', 'reserved', 'sold'])
        .order('created_at', { ascending: false })

      if (ignore) return

      if (queryError) {
        setError('Vehicles could not be loaded right now.')
        setVehicles([])
        setLoading(false)
        return
      }

      setError('')
      setVehicles(data || [])
      setLoading(false)
    }

    loadVehicles().catch(() => {
      if (ignore) return
      setVehicles([])
      setError('Vehicles could not be loaded right now. Please reload to try again.')
      setLoading(false)
    })
    return () => { ignore = true }
  }, [reloadToken])

  return { vehicles, loading, error }
}
