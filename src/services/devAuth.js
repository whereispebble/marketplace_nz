/**
 * Sesion de prueba para desarrollo.
 *
 * Permite entrar en las pantallas privadas (perfil, guardados, publicar,
 * mensajes) sin registrar una cuenta cada vez que se reinicia el proyecto.
 *
 * ---------------------------------------------------------------------------
 * POR QUE ESTO NO ES UN AGUJERO DE SEGURIDAD
 * ---------------------------------------------------------------------------
 * 1. Solo existe en desarrollo. import.meta.env.DEV vale false en `npm run
 *    build`, asi que el empaquetador borra este codigo del paquete final: en
 *    produccion no queda ni la funcion ni el usuario falso.
 * 2. Viene activado en desarrollo para que funcione nada mas clonar el
 *    proyecto, sin configurar nada. Se puede apagar con VITE_DEV_LOGIN=false.
 * 3. NO da acceso a datos reales. El usuario de prueba no existe en Supabase,
 *    asi que no tiene token: cualquier consulta a la base de datos sigue siendo
 *    una peticion anonima y las politicas RLS la tratan como tal. Esto engana a
 *    la interfaz, no al servidor. Es justo lo que se quiere para maquetar.
 *
 * Cuando se pase a datos reales basta con quitar VITE_DEV_LOGIN del .env.
 */

/**
 * Activo en desarrollo salvo que se apague a mano con VITE_DEV_LOGIN=false.
 *
 * Es "apagar" en vez de "encender" a proposito: asi quien clone el repositorio
 * tiene la sesion de prueba disponible sin tener que anadir nada a su .env, que
 * es un fichero que no viaja con el proyecto.
 */
export const DEV_LOGIN_ENABLED = import.meta.env.DEV
  && import.meta.env.VITE_DEV_LOGIN !== 'false'

/** Clave de sesion del navegador; se borra al cerrar la pestana. */
const DEV_SESSION_KEY = 'swapy:dev-session'

/** Evento que se emite al entrar o salir, para que la interfaz se entere. */
export const DEV_SESSION_EVENT = 'swapy:dev-session-changed'

/**
 * Usuario falso. El id tiene forma de UUID para que no reviente ninguna
 * consulta que lo use, pero no corresponde a ninguna cuenta real.
 */
export const DEV_USER = {
  id: '00000000-0000-4000-a000-0000000000de',
  email: 'dev@swapy.test',
  isDevUser: true,
}

/** Perfil que se muestra en /profile mientras dura la sesion de prueba. */
export const DEV_PROFILE = {
  id: DEV_USER.id,
  username: 'Dev Tester',
  email: DEV_USER.email,
  location: 'Raglan',
  phone: '+64 21 000 0000',
  bio: 'Cuenta de prueba para desarrollo. No existe en la base de datos.',
  avatar_url: null,
  rating: 4.7,
  total_sales: 5,
  joined: '2026',
}


/**
 * Indica si la sesion de prueba esta activa ahora mismo.
 * @returns {boolean}
 */
export function isDevSessionActive() {
  if (!DEV_LOGIN_ENABLED) return false
  try {
    return sessionStorage.getItem(DEV_SESSION_KEY) === 'on'
  } catch {
    return false
  }
}

/**
 * Activa o desactiva la sesion de prueba y avisa a la aplicacion.
 * @param {boolean} active
 */
export function setDevSession(active) {
  if (!DEV_LOGIN_ENABLED) return
  try {
    if (active) sessionStorage.setItem(DEV_SESSION_KEY, 'on')
    else sessionStorage.removeItem(DEV_SESSION_KEY)
  } catch {
    // Sin almacenamiento no se puede recordar entre recargas, pero el evento
    // siguiente hace que al menos la pantalla actual reaccione.
  }
  window.dispatchEvent(new CustomEvent(DEV_SESSION_EVENT))
}
