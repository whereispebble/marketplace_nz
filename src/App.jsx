/**
 * Rutas de la aplicacion.
 *
 * Define que pagina responde a cada direccion y cuales exigen sesion iniciada.
 * Las privadas van envueltas en RequireAuth, que redirige al login cuando no
 * hay usuario. La proteccion real de los datos esta en las politicas RLS de
 * Supabase; esto solo evita que alguien aterrice en una pantalla vacia.
 */

import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import RequireAuth from './components/RequireAuth'
import DevToolbar from './components/DevToolbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import ProductDetail from './pages/ProductDetail'
import NewProduct from './pages/NewProduct'
import Profile from './pages/Profile'
import Favorites from './pages/Favorites'
import Chat from './pages/Chat'
import HowItWorks from './pages/HowItWorks'
import Legal from './pages/Legal'

/**
 * Mientras se desarrolla, la aplicacion arranca en el login: entrar en "/" sin
 * sesion lleva a identificarse, y despues se vuelve a la portada.
 *
 * Poner a false para recuperar una portada publica que cualquiera pueda ver sin
 * cuenta, que es lo normal en un marketplace cuando salga a produccion.
 */
const REQUIRE_LOGIN_TO_BROWSE = true

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Portada. Con REQUIRE_LOGIN_TO_BROWSE exige sesion, asi que entrar
            en la aplicacion lleva directamente al login. */}
        <Route
          path="/"
          element={REQUIRE_LOGIN_TO_BROWSE ? <RequireAuth><Home /></RequireAuth> : <Home />}
        />

        {/* Publicas: cualquiera puede verlas, con o sin cuenta. */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/privacy" element={<Legal document="privacy" />} />
        <Route path="/terms" element={<Legal document="terms" />} />
        {/* Perfil publico de un vendedor: sus anuncios, sin datos de contacto. */}
        <Route path="/profile/:sellerId" element={<Profile />} />

        {/* Privadas: tocan datos de la cuenta, asi que exigen sesion. */}
        <Route path="/new-product" element={<RequireAuth><NewProduct /></RequireAuth>} />
        <Route path="/product/:id/edit" element={<RequireAuth><NewProduct /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
        <Route path="/favorites" element={<RequireAuth><Favorites /></RequireAuth>} />
        <Route path="/chats" element={<RequireAuth><Chat /></RequireAuth>} />
        <Route path="/chats/user/:sellerId" element={<RequireAuth><Chat /></RequireAuth>} />
        <Route path="/chats/:chatId" element={<RequireAuth><Chat /></RequireAuth>} />
      </Routes>

      {/* Panel de desarrollo. Devuelve null salvo en local con
          VITE_DEV_LOGIN=true, y no llega al paquete de produccion. */}
      <DevToolbar />
    </BrowserRouter>
  )
}

/**
 * Al cambiar de ruta la pagina vuelve arriba. Sin esto, entrar en un anuncio
 * desde la mitad de la parrilla deja la ficha empezada por el medio.
 */
function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname])

  return null
}

export default App
