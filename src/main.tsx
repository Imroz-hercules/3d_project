import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/sentinel.css'
import './styles/twin.css'
import { applyHudCssVariables } from './theme/cssVariables'
import { getTheme } from './theme/themeStore'
import App from './App.tsx'

// Avoid FOUC: apply persisted theme CSS vars before first paint
const boot = getTheme()
document.documentElement.dataset.theme = boot.name
applyHudCssVariables(boot.tokens.hud, boot.tokens.motion)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
