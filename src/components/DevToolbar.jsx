/**
 * Panel flotante de desarrollo.
 *
 * Permite entrar y salir de la sesion de prueba sin registrar una cuenta. Solo
 * se monta cuando DEV_LOGIN_ENABLED es cierto, es decir en desarrollo; en el
 * paquete de produccion no existe.
 *
 * Lleva el aviso "DEV" bien visible a proposito: si alguna vez aparece en un
 * entorno que no sea el local, es que algo esta mal configurado.
 */

import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiLogIn, FiLogOut, FiTool } from 'react-icons/fi'
import {
  DEV_LOGIN_ENABLED,
  DEV_SESSION_EVENT,
  DEV_USER,
  isDevSessionActive,
  setDevSession,
} from '../services/devAuth'
import { signOut, useSession } from '../services/session'

export default function DevToolbar() {
  const navigate = useNavigate()
  const [active, setActive] = useState(isDevSessionActive)
  // Arranca plegado como un circulo pequeno, para no tapar la interfaz.
  const [collapsed, setCollapsed] = useState(true)
  // Para poder ver de un vistazo que sesion hay: la de prueba, una real de
  // Supabase, o ninguna. Sin esto, una sesion real olvidada en el navegador
  // hace cosas raras y no se entiende por que.
  const { user } = useSession()

  // Se mantiene al dia si la sesion de prueba cambia desde otro sitio.
  useEffect(() => {
    const sync = () => setActive(isDevSessionActive())
    window.addEventListener(DEV_SESSION_EVENT, sync)
    return () => window.removeEventListener(DEV_SESSION_EVENT, sync)
  }, [])

  /**
   * Navega segun el cambio de la sesion de prueba:
   *   apagada -> encendida : a la portada, que es donde estan los datos de prueba
   *   encendida -> apagada : al login, como un cierre de sesion normal
   *
   * Va en un efecto que observa el cambio de estado, y no dentro del propio
   * boton, por dos motivos. Uno, asi tambien funciona cuando la sesion se
   * enciende desde otro sitio, como el boton "Continue as test user" de la
   * pantalla de login. Y dos, navegar en el mismo momento en que se cambia el
   * estado deja la navegacion a merced del orden en que React procese las dos
   * cosas; observando el cambio ya consolidado no hay carrera posible.
   */
  const previousActive = useRef(active)

  useEffect(() => {
    if (previousActive.current === active) return

    navigate(active ? '/' : '/login', { replace: true })
    previousActive.current = active
  }, [active, navigate])

  /**
   * Enciende la sesion de prueba, o cierra del todo la que haya.
   *
   * Al salir se usa signOut, que cierra tanto la de prueba como una posible
   * sesion real de Supabase: si solo se apagase la de prueba, un token antiguo
   * guardado en el navegador te dejaria identificado y de vuelta en la portada.
   *
   * De navegar se encarga el efecto de arriba.
   */
  const toggleSession = () => {
    if (isDevSessionActive()) signOut()
    else setDevSession(true)
  }

  if (!DEV_LOGIN_ENABLED) return null

  if (collapsed) {
    return (
      <button
        className={`dev-toolbar-dot ${active ? 'is-active' : ''}`}
        type="button"
        title={active ? `Dev tools - test session: ${DEV_USER.email}` : 'Dev tools'}
        aria-label="Show dev tools"
        onClick={() => setCollapsed(false)}
      >
        <FiTool />
      </button>
    )
  }

  return (
    <aside className="dev-toolbar" aria-label="Development tools">
      <header className="dev-toolbar-head">
        <span className="dev-toolbar-tag">DEV</span>
        <button type="button" onClick={() => setCollapsed(true)} aria-label="Hide dev tools">
          Hide
        </button>
      </header>

      <p className="dev-toolbar-status">
        {active && <>Test session: <strong>{DEV_USER.email}</strong></>}
        {!active && user && <>Real session: <strong>{user.email}</strong></>}
        {!active && !user && 'No session'}
      </p>

      <button
        className={`dev-toolbar-action ${active ? 'is-out' : ''}`}
        type="button"
        onClick={toggleSession}
      >
        {active ? <FiLogOut /> : <FiLogIn />}
        {active ? 'Leave test session' : 'Sign in as test user'}
      </button>

      <small className="dev-toolbar-note">
        Fake session: it unlocks the private screens with mock data. It has no
        Supabase token, so real database rows stay out of reach.
      </small>
    </aside>
  )
}
