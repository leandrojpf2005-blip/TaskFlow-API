import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initTheme } from './lib/theme'
import { LangProvider } from './lib/LangContext'
import { getSavedLang } from './lib/i18n'

// Stamp the saved theme on <html> before first paint (no flash of default).
initTheme()
document.documentElement.lang = getSavedLang()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LangProvider>
      <App />
    </LangProvider>
  </StrictMode>,
)

// Register the service worker in production so the app is installable / offline-capable.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}
