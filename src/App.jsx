import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import ProductDetail from './pages/ProductDetail'
import NewProduct from './pages/NewProduct'
import Profile from './pages/Profile'
import Favorites from './pages/Favorites'
import Chat from './pages/Chat'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/new-product" element={<NewProduct />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/chats" element={<Chat />} />
        <Route path="/chats/:chatId" element={<Chat />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App