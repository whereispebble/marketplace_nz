/**
 * Punto de entrada de la aplicacion.
 * Carga los estilos y monta el arbol de React sobre el div #root del index.html.
 * StrictMode solo actua en desarrollo: avisa de efectos mal limpiados montando
 * los componentes dos veces.
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary><App /></ErrorBoundary>
  </StrictMode>,
)
