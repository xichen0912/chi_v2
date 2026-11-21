import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { externalHref, parseRoute } from './lib/route'
import './styles.css'
import './askchi.css'

// Old in-app links such as ?view=map now live on their own pages.
const legacy = externalHref(parseRoute(window.location.search))
if (legacy) {
  window.location.replace(legacy)
} else {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
