import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import ProductDetail from './pages/ProductDetail'
import NewProduct from './pages/NewProduct'
import Profile from './pages/Profile'

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

      </Routes>

    </BrowserRouter>
  )
}

export default App