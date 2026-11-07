import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppProviders } from './contexts/AppProviders.tsx'
import './translations/index.ts'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
)
