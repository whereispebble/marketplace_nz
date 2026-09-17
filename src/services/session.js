/**
 * Sesion del usuario.
 *
 * Un unico sitio desde el que saber quien esta identificado, para que ninguna
 * pagina tenga que repetir la llamada a supabase.auth ni inventarse su propia
 * logica. Tambien es donde se limpia el rastro del usuario anterior al entrar
 * o salir, de modo que en un ordenador compartido no queden datos colgando.
 */

import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { clearGuestFavorites, mergeGuestFavoritesIntoAccount } from './favorites'
import { DEV_SESSION_EVENT, DEV_USER, isDevSessionActive, setDevSession } from './devAuth'

/** Tope de espera al comprobar la sesion, en milisegundos. */
const SESSION_TIMEOUT_MS = 6000

/**
 * Usuario autenticado en este momento.
 * @returns {Promise<object|null>} usuario de Supabase, o null si no hay sesion
 */
export async function getCurrentUser() {
  // Sesion de prueba de desarrollo: devuelve un usuario falso sin token. Esta
  // rama desaparece del paquete de produccion (ver services/devAuth.js).
  if (isDevSessionActive()) return DEV_USER

  const { data } = await supabase.auth.getUser()
  return data?.user || null
}

/**
 * Cierra la sesion por completo y borra lo que quede guardado en el navegador.
 *
 * Cierra las DOS: la de prueba y la real. Antes, al salir de la sesion de
 * prueba solo se apagaba esa, y si el navegador guardaba todavia un token de
 * Supabase de una prueba anterior, esa sesion real quedaba al descubierto: el
 * usuario seguia identificado y la aplicacion lo devolvia a la portada, con lo
 * que el boton parecia no hacer nada.
 *
 * Llamar a signOut de Supabase sin sesion activa no falla, asi que se hace
 * siempre y no hace falta comprobar antes cual de las dos habia.
 *
 * @returns {Promise<void>}
 */
export async function signOut() {
  // El orden importa: primero se cierra la sesion real y solo despues se apaga
  // la de prueba. Al reves, al apagar la de prueba quedaria un instante con la
  // sesion real todavia viva, la aplicacion te daria por identificado y te
  // devolveria a la portada antes de terminar de salir.
  const { error } = await supabase.auth.signOut({ scope: 'local' })
  if (error) throw new Error('Could not sign out. Please try again.')
  setDevSession(false)
  clearGuestFavorites()
  try {
    localStorage.removeItem('swapy:saved-searches')
    localStorage.removeItem('swapy:requests')
    for (const key of Object.keys(sessionStorage)) {
      if (key.startsWith('swapy:home-state')) sessionStorage.removeItem(key)
    }
  } catch { /* Browser storage may be unavailable. */ }
}

/**
 * Estado de sesion para un componente.
 *
 * Devuelve { user, loading }. Mientras loading sea true no se sabe todavia si
 * hay sesion, asi que una pagina privada debe esperar en vez de redirigir: si
 * no, al recargar echaria fuera a un usuario que si esta identificado.
 *
 * @returns {{user: object|null, loading: boolean}}
 */
export function useSession() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false
    let authRevision = 0

    // Entrar o salir de la sesion de prueba se refleja al momento.
    const syncDevSession = () => {
      if (ignore) return
      authRevision += 1
      setUser(isDevSessionActive() ? DEV_USER : null)
      setLoading(false)
    }
    window.addEventListener(DEV_SESSION_EVENT, syncDevSession)

    // Sesion inicial, la que venga guardada del arranque de la pagina.
    // Con un tope de tiempo: si Supabase no responde (proyecto pausado, sin
    // red, variables mal puestas) la aplicacion no puede quedarse colgada en
    // "Checking your session..." para siempre. Pasado el tope se sigue como
    // visitante anonimo, que es lo seguro.
    const timeout = setTimeout(() => {
      if (ignore) return
      setLoading(false)
    }, SESSION_TIMEOUT_MS)

    const initialRevision = authRevision
    getCurrentUser()
      .then(currentUser => {
        if (ignore || authRevision !== initialRevision) return
        setUser(currentUser)
      })
      .catch(() => {
        // Un fallo de red no debe dejar la pantalla bloqueada.
      })
      .finally(() => {
        if (ignore) return
        clearTimeout(timeout)
        setLoading(false)
      })

    // Cambios posteriores: login, logout, renovacion del token.
    const { data: subscription } = supabase.auth.onAuthStateChange((event, sessionData) => {
      if (ignore) return
      // Con la sesion de prueba activa mandan las funciones de devAuth, no
      // Supabase: si no, su primer aviso de "sin sesion" la echaria abajo.
      if (isDevSessionActive()) return
      authRevision += 1
      const nextUser = sessionData?.user || null
      setUser(nextUser)
      setLoading(false)

      // Al identificarse, los guardados del visitante anonimo pasan a su
      // cuenta y la copia local desaparece.
      if (event === 'SIGNED_IN' && nextUser) {
        setTimeout(() => {
          if (!ignore && !isDevSessionActive()) mergeGuestFavoritesIntoAccount(nextUser.id).catch(() => {})
        }, 0)
      }

      // Al salir no debe quedar nada del usuario anterior en el navegador.
      if (event === 'SIGNED_OUT') {
        clearGuestFavorites()
      }
    })

    return () => {
      ignore = true
      clearTimeout(timeout)
      window.removeEventListener(DEV_SESSION_EVENT, syncDevSession)
      subscription?.subscription?.unsubscribe()
    }
  }, [])

  return { user, loading }
}
