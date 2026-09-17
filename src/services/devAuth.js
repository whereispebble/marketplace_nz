/** Test sessions are available only in the local development build. */
export const DEV_LOGIN_ENABLED = import.meta.env.DEV && import.meta.env.VITE_DEV_LOGIN !== 'false'

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
