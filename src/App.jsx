import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
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

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/new-product" element={<NewProduct />} />
        <Route path="/product/:id/edit" element={<NewProduct />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/privacy" element={<Legal document="privacy" />} />
        <Route path="/terms" element={<Legal document="terms" />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/:sellerId" element={<Profile />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/chats" element={<Chat />} />
        <Route path="/chats/user/:sellerId" element={<Chat />} />
        <Route path="/chats/:chatId" element={<Chat />} />
      </Routes>
    </BrowserRouter>
  )
}

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname])

  return null
}

export default App
