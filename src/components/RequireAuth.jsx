/**
 * Guarda de rutas privadas.
 *
 * Envuelve las paginas que solo tienen sentido con sesion iniciada (publicar,
 * perfil propio, guardados, mensajes). Sin sesion manda al login y recuerda a
 * donde queria ir el usuario, para devolverlo alli despues de identificarse.
 *
 * Esto es comodidad de interfaz, no seguridad: quien proteje los datos de
 * verdad son las politicas RLS de Supabase, que se aplican aunque alguien
 * llame a la API sin pasar por esta aplicacion.
 */

import { Navigate, useLocation } from 'react-router-dom'
import { useSession } from '../services/session'
import LoadingScreen from './LoadingScreen'

/**
 * @param {{children: React.ReactNode}} props pagina que se quiere proteger
 */
export default function RequireAuth({ children }) {
  const { user, loading } = useSession()
  const location = useLocation()

  // Mientras se comprueba la sesion no se decide nada: redirigir aqui echaria
  // fuera a un usuario identificado cada vez que recarga la pagina.
  if (loading) {
    return <LoadingScreen fullPage label="Checking your session" />
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }

  return <div key={user.id} style={{ display: 'contents' }}>{children}</div>
}
