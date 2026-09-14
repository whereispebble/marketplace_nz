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
import { DEV_SESSION_EVENT } from '../services/devAuth'
import { withMockVehicles } from '../services/devData'

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
    setLoading(true)

    async function loadVehicles() {
      const { data, error: queryError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (ignore) return

      if (queryError) {
        setError('Vehicles could not be loaded right now.')
        setVehicles(await withMockVehicles([]))
        setLoading(false)
        return
      }

      setError('')
      setVehicles(await withMockVehicles(data || []))
      setLoading(false)
    }

    loadVehicles()
    return () => { ignore = true }
  }, [reloadToken])

  return { vehicles, loading, error }
}
