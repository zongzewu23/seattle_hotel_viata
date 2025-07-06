import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'mapbox-gl/dist/mapbox-gl.css'
import './index.css'
import App from './App.tsx'

// Debug: Verify CSS imports
if (import.meta.env.DEV) {
  console.log('🎯 CSS Import Status:', {
    mapboxCssImported: true,
    timestamp: new Date().toISOString()
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
