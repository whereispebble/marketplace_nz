import { useEffect } from 'react'
import { supabase } from './services/supabase'

function App() {
  useEffect(() => {
    const testConexion = async () => {
      const { data, error } = await supabase.from('products').select('*')
      if (error) {
        console.log('❌ Error:', error.message)
      } else {
        console.log('✅ Conexión exitosa:', data)
      }
    }
    testConexion()
  }, [])

  return (
    <div>
      <h1>Bienvenido a Marketplace</h1>
    </div>
  )
}

export default App